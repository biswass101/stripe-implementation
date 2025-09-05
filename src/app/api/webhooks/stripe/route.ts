import prisma from "@/db/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
    } catch (err: any) {
       return new Response("Webhook signature verification failed.", err.message);
    }


    try {
        switch(event.type) {
            case "checkout.session.completed":
                const session = await stripe.checkout.sessions.retrieve(
                    (event.data.object as Stripe.Checkout.Session).id,
                    {
                        expand: ["line_items"]
                    }
                );
                const customerId = session.customer as string
                const customerDetails = session.customer_details

                if(customerDetails?.email) {
                    const user = await prisma.user.findUnique({
                        where: { email: customerDetails.email }
                    })
                    if(!user) throw new Error("User not found");

                    if(!user.customerId) {
                        await prisma.user.update({
                            where: { id: user.id},
                            data: { customerId }
                        })
                    }
                }

                const lineItems = session.line_items?.data || []

                for (const item of lineItems) {
                    const priceId = item.price?.id;
                    const isSubscription = item.price?.type === 'recurring';

                    if(isSubscription) {
                        let endDate = new Date();
                        if(priceId === process.env.STRIPE_YEARLY_PLAN_LINK!) {
                            endDate.setFullYear(endDate.getFullYear() + 1); //1 year from now
                        } else if(priceId === process.env.STRIPE_MONTHLY_PLAN_LINK) {
                            endDate.setMonth(endDate.getMonth() + 1); //1 month from now
                        } else {
                            throw new Error("Invalid priceId");
                        }

                        // await prisma.subscription.upsert({
                        //     where: { userId: },
                        //     create: {
                        //         userId: user.id
                        //     },
                        //     update: {

                        //     }
                        // })
                    }
                }
        }
    } catch (error) {
        
    }
}

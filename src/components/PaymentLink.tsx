"use client";

import Link from "next/link";
import { buttonVariants } from "./ui/button";

type PaymentLinkProps = {
  href: string;
  paymentLink?: string;
  text: string;
};

export default function PaymentLink({
  href,
  paymentLink,
  text,
}: PaymentLinkProps) {
  return (
    <div>
      <Link href={href} className={buttonVariants()}
      onClick={() => {
        if(paymentLink) {
            localStorage.setItem('stripePaymentLink',paymentLink)
        }
      }}>
        {text}
      </Link>
    </div>
  );
}

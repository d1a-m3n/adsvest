import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

/*
if (!PAYSTACK_PLAN_CODE) {
  throw new Error("PAYSTACK_PLAN_CODE is not defined");
}
*/

export const initializeMembershipPayment = async (
  email: string,
  userId: number,
) => {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: 50000,
        currency: "NGN",
        callback_url: `${process.env.FRONTEND_URL}/subscription/success`,
        metadata: {
          userId,
          purpose: "membership",
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize Paystack payment");
  }

  return data.data;
};

export const verifyPaystackSignature = (payload: string, signature: string) => {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return hash === signature;
};

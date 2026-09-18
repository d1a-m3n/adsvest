import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  verificationUrl: string,
) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verify your Advest email",
    html: `
      <h2>Welcome to Advest!</h2>

      <p>Thanks for creating your Advest account.</p>

      <p>Please click the button below to verify your email address:</p>

      <a href="${verificationUrl}">
        Verify my email
      </a>

      <p>This verification link will expire soon.</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

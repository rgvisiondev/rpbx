type Props = { link: string };

export default function ValuationEmail({ link }: Props) {
  return (
    <div>
      <h2>Thanks for your purchase!</h2>
      <p>Your business valuation is ready. Click the button below to begin:</p>
      <p><a href={link}>Start your valuation</a></p>
      <p>
        If the button doesn’t work, copy and paste this URL into your browser:
        <br />
        {link}
      </p>
      <p>— RioPlex Team</p>
    </div>
  );
}

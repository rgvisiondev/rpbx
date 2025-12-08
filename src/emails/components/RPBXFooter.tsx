// emails/components/RPBXFooter.tsx
import { Section, Img, Text, Row, Column, Link } from "@react-email/components";

type FooterProps = {
  tagline?: string;
};

export function RPBXFooter({
  tagline = "Where Businesses Meet Opportunity",
}: FooterProps) {
  return (
    <Section className="text-center px-[24px] py-[16px]">
      <table className="w-full">
        <tr className="w-full">
          <td align="center">
            <Link href="https://rioplexbusinessexchange.com">
            <Img
              alt="RPBX logo"
              height="100"
              src="https://rioplexbizx.com/images/emails/rpbx-logo-cropped.svg"
              width="120"
            />
            </Link>
          </td>
        </tr>

        <tr className="w-full">
          <td align="center">
            <Text className="my-[8px] font-semibold text-[16px] text-gray-900 leading-[24px]">
              RioPlex Business Exchange
            </Text>
            <Text className="mt-[4px] mb-0 text-[14px] text-gray-500 leading-[20px]">
              {tagline}
            </Text>
          </td>
        </tr>

        <tr>
          <td align="center">
            <Row className="table-cell h-[44px] align-bottom">
              <Column className="pr-[10px]">
                <Link href="https://www.facebook.com/p/RioPlex-Business-Exchange-61567482254380/">
                  <Img
                    alt="Facebook"
                    height="25"
                    src="https://rioplexbizx.com/images/emails/facebook2.svg"
                    width="25"
                  />
                </Link>
              </Column>

              <Column className="pr-[10px]">
                <Link href="https://www.linkedin.com/company/rioplex-business-exchange/">
                  <Img
                    alt="LinkedIn"
                    height="25"
                    src="https://rioplexbizx.com/images/emails/linkedin2.svg"
                    width="25"
                  />
                </Link>
              </Column>
              <Column>
                <Link href="https://www.instagram.com/rioplexbe/">
                  <Img
                    alt="Instagram"
                    height="25"
                    src="https://rioplexbizx.com/images/emails/instagram2.svg"
                    width="25"
                  />
                </Link>
              </Column>
            </Row>
          </td>
        </tr>

        <tr>
          <td align="center">
            <Text className="my-[8px] font-semibold text-[14px] text-gray-500 leading-[20px]">
              100 E Nolana Ave #130, McAllen, TX 78504
            </Text>
            <Text className="mt-[4px] mb-0 font-semibold text-[14px] text-gray-500 leading-[20px]">
              info@rioplexbizx.com · +1 (956) 322-5942
            </Text>
          </td>
        </tr>
      </table>
    </Section>
  );
}

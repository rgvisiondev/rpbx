import { Section, Row, Column, Img, Link, Tailwind } from "@react-email/components";

export function RPBXHeader() {
    return(
    <Tailwind>
    <Section className="px-[32px] py-[40px]">
        <Row>
        <Column className="w-[80%]">
            <Link href="https://rioplexbusinessexchange.com">
            <Img
            alt="RPBX logo"
            width="120"
            height="100"
            src="https://rioplexbizx.com/images/emails/rpbx-logo-cropped.svg"
            />
            </Link>
        </Column>
        <Column align="right">
            <Row align="right">
            <Column>
                <Link href="https://www.facebook.com/p/RioPlex-Business-Exchange-61567482254380/">
                  <Img
                    alt="Facebook"
                    height="25"
                    src="https://rioplexbizx.com/images/emails/facebook2.svg"
                    width="25"
                  />
                </Link>
            </Column>
            <Column>
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
        </Column>
        </Row>
    </Section>  
    </Tailwind>
);
}
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Tailwind,
  Hr,
  Img
} from "@react-email/components";

import { RPBXHeader } from "./components/RPBXHeader";
import { RPBXFooter } from "./components/RPBXFooter";


export default function BoostedListingEmail(){
    return(
        <Html>
            <Head/>
            <Preview>
                Your listing boost is now active—here&apos;s what to expect next.
            </Preview>
            <Tailwind>
                <Container>
                    <Body className="bg=[#f3f4f6] font-sans">
                        <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white">
                            <RPBXHeader />
                            <Hr className="m-0 border-gray-200" />
                            <Section className="px-[24px] py-[24px]">
                                <Text className="mb-[8px] text-[20px] font-semibold text-gray-900">
                                    Thanks for your purchase!
                                </Text>
                                <Text className="mt-0 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                                    Your listing has been successfully boosted and is now receiving increased visibility
                                    across the RioPlex platform.
                                </Text>
                                <Section>
                                    <Row>
                                        <Text className="m-0 font-semibold text-[20px] text-gray-900">
                                            Boosting your listing helps you:
                                        </Text>
                                    </Row>
                                </Section>
                                <Row className="mt-[16px]">
                                    <Column align="center" className="w-1/3 pr-[12px] align-baseline">
                                        <Img 
                                            alt="Search Icon"
                                            height="48"
                                            src="https://rioplexbizx.com/images/emails/search.svg"
                                            width="48"
                                        />
                                        <Text className="m-0 mt-[16px] font-semibold text=[16px] text-gray-700 leading-[24px]">
                                            Appear higher in investor search results
                                        </Text>
                                    </Column>
                                    <Column align="center" className="w-1/3 pr-[12px] align-baseline">
                                        <Img 
                                            alt="Users Icon"
                                            height="48"
                                            src="https://rioplexbizx.com/images/emails/users.svg"
                                            width="48"
                                        />
                                        <Text className="m-0 mt-[16px] font-semibold text=[16px] text-gray-700 leading-[24px]">
                                            Gain more views on your listing
                                        </Text>
                                    </Column>
                                    <Column align="center" className="w-1/3 pr-[12px] align-baseline">
                                        <Img 
                                            alt="Boosted Icon"
                                            height="48"
                                            src="https://rioplexbizx.com/images/emails/boosted.svg"
                                            width="48"
                                        />
                                        <Text className="m-0 mt-[16px] font-semibold text=[16px] text-gray-700 leading-[24px]">
                                            Stand out with premium placement and enhanced exposure
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>
            <Hr className="m-0 border-gray-200" />

            {/* Footer (simplified, inspired by your snippet) */}
              <RPBXFooter />  

                        </Container>
                    </Body>
                </Container>
            </Tailwind>
        </Html>
    );
}
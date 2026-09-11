/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Код подтверждения {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{siteName}</Heading>
        <Text style={text}>
          Спасибо за регистрацию в{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        {token ? (
          <>
            <Text style={text}>Ваш код подтверждения:</Text>
            <Section style={codeBox}>
              <Text style={code}>{token}</Text>
            </Section>
            <Text style={text}>
              Введите этот код на сайте, чтобы подтвердить адрес{' '}
              <Link href={`mailto:${recipient}`} style={link}>
                {recipient}
              </Link>
              . Код действует 1 час.
            </Text>
          </>
        ) : null}
        <Text style={text}>Или просто нажмите кнопку:</Text>
        <Button style={button} href={confirmationUrl}>
          Подтвердить почту
        </Button>
        <Text style={footer}>
          Если вы не регистрировались, просто проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#C1663F',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 20px',
}
const link = { color: '#C1663F', textDecoration: 'underline' }
const codeBox = {
  backgroundColor: '#FBF3EE',
  border: '1px solid #C1663F',
  borderRadius: '10px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const code = {
  fontSize: '32px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: '#C1663F',
  margin: '0',
}
const button = {
  backgroundColor: '#C1663F',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid #C1663F',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }

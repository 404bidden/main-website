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
} from '@react-email/components';

interface ResetPasswordEmailProps {
    resetLink: string;
    userFirstName?: string;
}

export const ResetPasswordEmail = ({
    resetLink,
    userFirstName = 'there',
}: ResetPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Reset your password for 404bidden</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    <Heading style={styles.heading}>Password Reset</Heading>
                    <Section style={styles.section}>
                        <Text style={styles.text}>Hi {userFirstName},</Text>
                        <Text style={styles.text}>
                            We received a request to reset your password for your 404bidden account.
                            If you didn't make this request, you can safely ignore this email.
                        </Text>
                        <Text style={styles.text}>
                            To reset your password, click the button below:
                        </Text>
                        <Button
                            className="box-border w-full rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white"
                            href={resetLink}
                        >
                            Reset Password
                        </Button>
                        <Text style={styles.text}>
                            If the button doesn't work, you can also copy and paste the following link into your browser:
                        </Text>
                        <Text style={styles.link}>
                            <Link href={resetLink} style={styles.linkText}>{resetLink}</Link>
                        </Text>
                        <Text style={styles.text}>
                            This link will expire in 24 hours for security reasons.
                        </Text>
                        <Text style={styles.text}>
                            Thanks,<br />
                            The 404bidden Team
                        </Text>
                    </Section>
                    <Text style={styles.footer}>
                        © {new Date().getFullYear()} 404bidden. All rights reserved.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default ResetPasswordEmail;

const styles = {
    body: {
        backgroundColor: '#f6f9fc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        margin: 0,
        padding: 0,
    },
    container: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        margin: '40px auto',
        maxWidth: '600px',
        padding: '20px',
    },
    heading: {
        color: '#333',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '24px',
        textAlign: 'center' as const,
    },
    section: {
        padding: '0 24px',
    },
    text: {
        color: '#444',
        fontSize: '16px',
        lineHeight: '24px',
        marginBottom: '16px',
    },
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: '4px',
        color: '#fff',
        display: 'block',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '24px',
        marginTop: '24px',
        textAlign: 'center' as const,
        textDecoration: 'none',
        width: '100%',
    },
    link: {
        marginBottom: '16px',
    },
    linkText: {
        color: '#3b82f6',
        fontSize: '14px',
        textDecoration: 'underline',
        wordBreak: 'break-all' as const,
    },
    footer: {
        color: '#8898aa',
        fontSize: '12px',
        lineHeight: '22px',
        marginTop: '32px',
        textAlign: 'center' as const,
    },
};
export default function TermsOfService() {
  const containerStyle = {
    fontFamily: "'Times New Roman', serif",
    lineHeight: '1.6',
    color: '#333',
    backgroundColor: '#fff',
    padding: '2rem 1rem',
    maxWidth: '900px',
    margin: '0 auto',
    minHeight: '100vh'
  }

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '2px solid #e5e5e5'
  }

  const h1Style = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1a1a1a'
  }

  const lastUpdatedStyle = {
    fontSize: '1rem',
    color: '#666',
    fontStyle: 'italic' as const
  }

  const contentStyle = {
    maxWidth: '800px',
    margin: '0 auto'
  }

  const h2Style = {
    fontSize: '1.5rem',
    margin: '2rem 0 1rem 0',
    color: '#1a1a1a',
    fontWeight: 'bold'
  }

  const h3Style = {
    fontSize: '1.25rem',
    margin: '1.5rem 0 0.75rem 0',
    color: '#2a2a2a',
    fontWeight: 'bold'
  }

  const pStyle = {
    marginBottom: '1rem',
    textAlign: 'justify' as const
  }

  const ulStyle = {
    margin: '1rem 0 1rem 2rem'
  }

  const liStyle = {
    marginBottom: '0.5rem'
  }

  const sectionStyle = {
    marginBottom: '2rem'
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={h1Style}>Terms of Service</h1>
        <div style={lastUpdatedStyle}>Last updated: January 2026</div>
      </div>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Agreement to Terms</h2>
          <p style={pStyle}>By accessing and using GrokInterviews ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, you may not access or use our service.</p>
          <p style={pStyle}>These Terms of Service apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Description of Service</h2>
          <p style={pStyle}>GrokInterviews is an AI-powered interview preparation platform that provides:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Access to 3.6+ million curated learning resources</li>
            <li style={liStyle}>81,499+ technical interview questions across 5 major domains</li>
            <li style={liStyle}>Local-first progress tracking and bookmarking</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. User Account and Registration</h2>

          <h3 style={h3Style}>3.1 Account Creation</h3>
          <p style={pStyle}>You may create an account through Google OAuth authentication. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

          <h3 style={h3Style}>3.2 Account Information</h3>
          <p style={pStyle}>You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>

          <h3 style={h3Style}>3.3 Account Security</h3>
          <p style={pStyle}>You are solely responsible for your account and the security of your device. We cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Acceptable Use</h2>

          <h3 style={h3Style}>4.1 Permitted Use</h3>
          <p style={pStyle}>You may use our service for lawful purposes only. You agree to use the service in accordance with:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>All applicable laws and regulations</li>
            <li style={liStyle}>These Terms of Service</li>
            <li style={liStyle}>Our Privacy Policy</li>
            <li style={liStyle}>General principles of internet etiquette</li>
          </ul>

          <h3 style={h3Style}>4.2 Prohibited Activities</h3>
          <p style={pStyle}>You agree not to:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Use the service for any unlawful purpose or to solicit unlawful activity</li>
            <li style={liStyle}>Attempt to gain unauthorized access to our systems or networks</li>
            <li style={liStyle}>Use any automated system to access the service in a manner that sends more requests than reasonably necessary</li>
            <li style={liStyle}>Reverse engineer, decompile, or attempt to extract source code from our service</li>
            <li style={liStyle}>Share, distribute, or resell our content without explicit permission</li>
            <li style={liStyle}>Create accounts through unauthorized means or for fraudulent purposes</li>
            <li style={liStyle}>Interfere with or disrupt our service or servers</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Content and Intellectual Property</h2>

          <h3 style={h3Style}>5.1 Our Content</h3>
          <p style={pStyle}>All content available through our service, including but not limited to questions, answers, explanations, resources, text, graphics, logos, and software, is the property of GrokInterviews or its licensors and is protected by copyright, trademark, and other intellectual property laws.</p>

          <h3 style={h3Style}>5.2 User Content</h3>
          <p style={pStyle}>You retain ownership of any content you submit, post, or display through our service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, modify, and display such content in connection with our service.</p>

          <h3 style={h3Style}>5.3 Third-Party Content</h3>
          <p style={pStyle}>Our service may include content from third parties. We do not control or endorse such content and are not responsible for its accuracy or availability.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Privacy and Data Protection</h2>
          <p style={pStyle}>Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our service, you consent to our Privacy Policy.</p>
          <p style={pStyle}>We do not collect or store your learning data, progress, or bookmarks on our servers; this information remains in your browser's local storage. We only store your email for authentication purposes.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Service Availability</h2>

          <h3 style={h3Style}>7.1 Service Access</h3>
          <p style={pStyle}>We strive to maintain consistent service availability, but we do not guarantee that our service will be available at all times. We may suspend or restrict access to our service at any time for maintenance, updates, or other operational reasons.</p>

          <h3 style={h3Style}>7.2 Modifications to Service</h3>
          <p style={pStyle}>We reserve the right to modify, suspend, or discontinue any part of our service at any time without prior notice. We are not liable for any modification, suspension, or discontinuance of the service.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Free Service and Limitations</h2>
          <p style={pStyle}>GrokInterviews is currently provided free of charge. However, we reserve the right to:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Implement usage limits or restrictions</li>
            <li style={liStyle}>Introduce paid features or subscription plans</li>
            <li style={liStyle}>Modify the scope of free services offered</li>
          </ul>
          <p style={pStyle}>We will provide reasonable notice of any material changes to our pricing structure.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Disclaimers and Limitation of Liability</h2>

          <h3 style={h3Style}>9.1 Service Disclaimers</h3>
          <p style={pStyle}>Our service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>The service will meet your specific requirements</li>
            <li style={liStyle}>The service will be uninterrupted, timely, secure, or error-free</li>
            <li style={liStyle}>The results obtained from using the service will be accurate or reliable</li>
            <li style={liStyle}>Any errors in the service will be corrected</li>
          </ul>

          <h3 style={h3Style}>9.2 Educational Purpose</h3>
          <p style={pStyle}>Our content is for educational and preparation purposes only. We do not guarantee that using our service will result in job offers, interview success, or specific career outcomes.</p>

          <h3 style={h3Style}>9.3 Limitation of Liability</h3>
          <p style={pStyle}>To the maximum extent permitted by law, GrokInterviews shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Third-Party Services and AI Models</h2>

          <h3 style={h3Style}>10.1 BYOK (Bring Your Own Key) Model</h3>
          <p style={pStyle}>Certain advanced features, such as voice interviews and AI-powered text generation, operate on a "Bring Your Own Key" model. You provide your own OpenAI API key, which is stored locally on your device.</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Your API key is not stored on our servers.</li>
            <li style={liStyle}>Usage costs are billed directly to you by the AI provider (e.g., OpenAI).</li>
            <li style={liStyle}>You are responsible for managing your API key security and usage limits.</li>
          </ul>

          <h3 style={h3Style}>10.2 Supported Third-Party Services</h3>
          <p style={pStyle}>Our service integrates with the following third-party services:</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Google OAuth:</strong> For authentication</li>
            <li style={liStyle}><strong>OpenAI:</strong> For AI-powered conversation and voice features (using your API key)</li>
            <li style={liStyle}><strong>Supabase:</strong> For authentication and secure data storage</li>
            <li style={liStyle}><strong>Vercel:</strong> For hosting and deployment</li>
          </ul>
          <p style={pStyle}>These third-party services have their own terms of service and privacy policies. We are not responsible for the terms or practices of these third-party services.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Termination</h2>

          <h3 style={h3Style}>11.1 Termination by You</h3>
          <p style={pStyle}>You may terminate your account at any time by contacting us or through account settings. Upon termination, your right to use the service will cease immediately.</p>

          <h3 style={h3Style}>11.2 Termination by Us</h3>
          <p style={pStyle}>We may terminate or suspend your account and access to our service immediately, without prior notice, for any reason, including breach of these Terms of Service.</p>

          <h3 style={h3Style}>11.3 Effect of Termination</h3>
          <p style={pStyle}>Upon termination, all provisions of these Terms which should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Changes to Terms</h2>
          <p style={pStyle}>We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the new Terms on our website and updating the "Last updated" date.</p>
          <p style={pStyle}>Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. Governing Law</h2>
          <p style={pStyle}>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which GrokInterviews operates, without regard to conflict of law provisions.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>14. Contact Information</h2>
          <p style={pStyle}>If you have any questions about these Terms of Service, please contact us at:</p>
          <div>
            <p style={pStyle}><strong>Email:</strong> hello@grokinterviews.org</p>
            <p style={pStyle}><strong>Website:</strong> www.grokinterviews.org</p>
          </div>
        </section>


      </div>
    </div>
  )
}
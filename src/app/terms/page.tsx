import Head from 'next/head';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - GrokInterviews</title>
        <meta name="description" content="Terms of Service for GrokInterviews platform" />
      </Head>
      <main>
        <h1>Terms of Service</h1>
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Agreement to Terms</h2>
        <p>By accessing and using GrokInterviews ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, you may not access or use our service.</p>
        <p>These Terms of Service apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.</p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>GrokInterviews is an AI-powered interview preparation platform that provides:</p>
        <ul>
          <li>Access to 3.6+ million curated learning resources</li>
          <li>81,499+ technical interview questions across 5 major domains</li>
          <li>AI-powered personalized answers and recommendations</li>
          <li>Progress tracking and analytics</li>
          <li>Bookmark and study planning features</li>
          <li>User dashboard and activity monitoring</li>
        </ul>
      </section>

      <section>
        <h2>3. User Account and Registration</h2>
        
        <h3>3.1 Account Creation</h3>
        <p>You may create an account through Google OAuth authentication. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

        <h3>3.2 Account Information</h3>
        <p>You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>

        <h3>3.3 Account Security</h3>
        <p>You are solely responsible for your account and the security of your device. We cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.</p>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        
        <h3>4.1 Permitted Use</h3>
        <p>You may use our service for lawful purposes only. You agree to use the service in accordance with:</p>
        <ul>
          <li>All applicable laws and regulations</li>
          <li>These Terms of Service</li>
          <li>Our Privacy Policy</li>
          <li>General principles of internet etiquette</li>
        </ul>

        <h3>4.2 Prohibited Activities</h3>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose or to solicit unlawful activity</li>
          <li>Attempt to gain unauthorized access to our systems or networks</li>
          <li>Use any automated system to access the service in a manner that sends more requests than reasonably necessary</li>
          <li>Reverse engineer, decompile, or attempt to extract source code from our service</li>
          <li>Share, distribute, or resell our content without explicit permission</li>
          <li>Create accounts through unauthorized means or for fraudulent purposes</li>
          <li>Interfere with or disrupt our service or servers</li>
        </ul>
      </section>

      <section>
        <h2>5. Content and Intellectual Property</h2>
        
        <h3>5.1 Our Content</h3>
        <p>All content available through our service, including but not limited to questions, answers, explanations, resources, text, graphics, logos, and software, is the property of GrokInterviews or its licensors and is protected by copyright, trademark, and other intellectual property laws.</p>

        <h3>5.2 User Content</h3>
        <p>You retain ownership of any content you submit, post, or display through our service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, modify, and display such content in connection with our service.</p>

        <h3>5.3 Third-Party Content</h3>
        <p>Our service may include content from third parties. We do not control or endorse such content and are not responsible for its accuracy or availability.</p>
      </section>

      <section>
        <h2>6. Privacy and Data Protection</h2>
        <p>Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our service, you consent to our Privacy Policy.</p>
        <p>We use your data to provide personalized learning experiences, track progress, and improve our service. All data is processed in accordance with applicable data protection laws.</p>
      </section>

      <section>
        <h2>7. Service Availability</h2>
        
        <h3>7.1 Service Access</h3>
        <p>We strive to maintain consistent service availability, but we do not guarantee that our service will be available at all times. We may suspend or restrict access to our service at any time for maintenance, updates, or other operational reasons.</p>

        <h3>7.2 Modifications to Service</h3>
        <p>We reserve the right to modify, suspend, or discontinue any part of our service at any time without prior notice. We are not liable for any modification, suspension, or discontinuance of the service.</p>
      </section>

      <section>
        <h2>8. Free Service and Limitations</h2>
        <p>GrokInterviews is currently provided free of charge. However, we reserve the right to:</p>
        <ul>
          <li>Implement usage limits or restrictions</li>
          <li>Introduce paid features or subscription plans</li>
          <li>Modify the scope of free services offered</li>
        </ul>
        <p>We will provide reasonable notice of any material changes to our pricing structure.</p>
      </section>

      <section>
        <h2>9. Disclaimers and Limitation of Liability</h2>
        
        <h3>9.1 Service Disclaimers</h3>
        <p>Our service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that:</p>
        <ul>
          <li>The service will meet your specific requirements</li>
          <li>The service will be uninterrupted, timely, secure, or error-free</li>
          <li>The results obtained from using the service will be accurate or reliable</li>
          <li>Any errors in the service will be corrected</li>
        </ul>

        <h3>9.2 Educational Purpose</h3>
        <p>Our content is for educational and preparation purposes only. We do not guarantee that using our service will result in job offers, interview success, or specific career outcomes.</p>

        <h3>9.3 Limitation of Liability</h3>
        <p>To the maximum extent permitted by law, GrokInterviews shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
      </section>

      <section>
        <h2>10. Third-Party Services</h2>
        <p>Our service integrates with third-party services including:</p>
        <ul>
          <li><strong>Google OAuth:</strong> For authentication</li>
          <li><strong>Groq API:</strong> For AI-powered features</li>
          <li><strong>Supabase:</strong> For data storage and real-time features</li>
          <li><strong>Vercel:</strong> For hosting and deployment</li>
        </ul>
        <p>These third-party services have their own terms of service and privacy policies. We are not responsible for the terms or practices of these third-party services.</p>
      </section>

      <section>
        <h2>11. Termination</h2>
        
        <h3>11.1 Termination by You</h3>
        <p>You may terminate your account at any time by contacting us or through account settings. Upon termination, your right to use the service will cease immediately.</p>

        <h3>11.2 Termination by Us</h3>
        <p>We may terminate or suspend your account and access to our service immediately, without prior notice, for any reason, including breach of these Terms of Service.</p>

        <h3>11.3 Effect of Termination</h3>
        <p>Upon termination, all provisions of these Terms which should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.</p>
      </section>

      <section>
        <h2>12. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the new Terms on our website and updating the "Last updated" date.</p>
        <p>Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service.</p>
      </section>

      <section>
        <h2>13. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which GrokInterviews operates, without regard to conflict of law provisions.</p>
      </section>

      <section>
        <h2>14. Contact Information</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <div>
          <p><strong>Email:</strong> hello@grokinterviews.org</p>
          <p><strong>Website:</strong> www.grokinterviews.org</p>
        </div>
      </section>

      <section>
        <p><strong>By using GrokInterviews, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong></p>
        <p>These terms are designed to ensure a fair and secure experience for all users while protecting the intellectual property and operational integrity of our platform.</p>
      </section>
    </main>
    </>
  )
}
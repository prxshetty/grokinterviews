export default function PrivacyPolicy() {
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

  const summaryStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '2rem',
    marginTop: '3rem'
  }

  const summaryH2Style = {
    ...h2Style,
    marginTop: '0',
    color: '#495057'
  }

  const summaryContentStyle = {
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#495057'
  }

  const summaryUlStyle = {
    ...ulStyle,
    fontSize: '0.95rem',
    color: '#6c757d'
  }

  const linkStyle = {
    color: '#007bff',
    textDecoration: 'underline'
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={h1Style}>Privacy Policy</h1>
        <div style={lastUpdatedStyle}>Last updated: July 2025</div>
      </div>
        
      <div style={contentStyle}>
        
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Introduction</h2>
          <p style={pStyle}>Welcome to GrokInterviews ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered interview preparation platform and related services (the "Service").</p>
          <p style={pStyle}>By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Information We Collect</h2>
          
          <h3 style={h3Style}>2.1 Personal Information</h3>
          <p style={pStyle}>When you create an account through Google OAuth, we collect:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Your Google profile information (name, email address, profile picture)</li>
            <li style={liStyle}>Google account ID for authentication purposes</li>
          </ul>

          <h3 style={h3Style}>2.2 Usage and Activity Data</h3>
          <p style={pStyle}>We automatically collect information about your interaction with our Service:</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Progress Tracking:</strong> Your completion status across 81,499+ interview questions and 2,394 technical topics</li>
            <li style={liStyle}><strong>Activity Data:</strong> Learning sessions, time spent on topics, question attempts, and study patterns</li>
            <li style={liStyle}><strong>Bookmarks:</strong> Questions and resources you save for later review</li>
            <li style={liStyle}><strong>Preferences:</strong> Your learning preferences, difficulty settings, and AI model choices</li>
            <li style={liStyle}><strong>Search Queries:</strong> Topics and questions you search for within our platform</li>
            <li style={liStyle}><strong>Performance Analytics:</strong> Your progress across different domains (AI & ML, Web Development, System Design, DSA, Machine Learning)</li>
          </ul>

          <h3 style={h3Style}>2.3 Technical Data</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>IP address and device information</li>
            <li style={liStyle}>Browser type and version</li>
            <li style={liStyle}>Operating system</li>
            <li style={liStyle}>Session data and cookies</li>
            <li style={liStyle}>Log data including access times and pages visited</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. How We Use Your Information</h2>
          <p style={pStyle}>We use the collected information for the following purposes:</p>
          
          <h3 style={h3Style}>3.1 Core Service Functionality</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Providing access to our library of 3.6+ million learning resources</li>
            <li style={liStyle}>Generating personalized AI-powered answers using Groq API</li>
            <li style={liStyle}>Tracking your progress across topics and categories</li>
            <li style={liStyle}>Creating personalized learning recommendations</li>
            <li style={liStyle}>Maintaining your bookmarks and study lists</li>
          </ul>

          <h3 style={h3Style}>3.2 Personalization and Analytics</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Customizing content based on your learning preferences</li>
            <li style={liStyle}>Providing progress analytics and performance insights</li>
            <li style={liStyle}>Generating activity grids showing learning patterns</li>
            <li style={liStyle}>Recommending study paths and next topics</li>
          </ul>

          <h3 style={h3Style}>3.3 Service Improvement</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Analyzing usage patterns to improve our platform</li>
            <li style={liStyle}>Optimizing our AI models and content recommendations</li>
            <li style={liStyle}>Identifying and fixing technical issues</li>
            <li style={liStyle}>Developing new features based on user behavior</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Information Sharing and Disclosure</h2>
          
          <h3 style={h3Style}>4.1 Third-Party Services</h3>
          <p style={pStyle}>We share information with the following third-party services:</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Google:</strong> For authentication services (OAuth) and text-to-speech functionality</li>
            <li style={liStyle}><strong>Groq:</strong> For speech-to-text conversion and AI-powered conversation/answer generation (questions and context only, no personal data)</li>
            <li style={liStyle}><strong>Supabase:</strong> For database hosting and real-time features</li>
            <li style={liStyle}><strong>Vercel:</strong> For application hosting and analytics</li>
            <li style={liStyle}><strong>VAPI:</strong> For phone voice interview features - <a href="https://vapi.ai/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>https://vapi.ai/privacy</a></li>
          </ul>

          <h3 style={h3Style}>4.2 Legal Requirements</h3>
          <p style={pStyle}>We may disclose your information if required by law or in response to valid legal requests.</p>

          <h3 style={h3Style}>4.3 Business Transfers</h3>
          <p style={pStyle}>In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Data Storage and Security</h2>
          
          <h3 style={h3Style}>5.1 Data Storage</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Your data is stored securely using Supabase (PostgreSQL) with Row Level Security (RLS)</li>
            <li style={liStyle}>We implement database encryption and secure access controls</li>
            <li style={liStyle}>Real-time data synchronization with encrypted connections</li>
          </ul>

          <h3 style={h3Style}>5.2 Security Measures</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>SSL/TLS encryption for all data transmission</li>
            <li style={liStyle}>Secure authentication using Google OAuth 2.0</li>
            <li style={liStyle}>Regular security audits and updates</li>
            <li style={liStyle}>Access controls and monitoring systems</li>
            <li style={liStyle}>Data backup and recovery procedures</li>
          </ul>

          <h3 style={h3Style}>5.3 Data Retention</h3>
          <p style={pStyle}>We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Your Rights and Choices</h2>
          
          <h3 style={h3Style}>6.1 Account Control</h3>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Access:</strong> View and manage your profile information</li>
            <li style={liStyle}><strong>Update:</strong> Modify your preferences and settings</li>
            <li style={liStyle}><strong>Export:</strong> Request a copy of your data</li>
            <li style={liStyle}><strong>Delete:</strong> Request deletion of your account and data</li>
          </ul>

          <h3 style={h3Style}>6.2 Privacy Settings</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Control your learning preferences and AI model selection</li>
            <li style={liStyle}>Manage bookmark and progress visibility</li>
            <li style={liStyle}>Opt out of certain data collection features</li>
          </ul>

          <h3 style={h3Style}>6.3 Communication</h3>
          <p style={pStyle}>We currently do not send marketing emails. All communication is service-related and necessary for platform functionality.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Cookies and Tracking</h2>
          <p style={pStyle}>We use essential cookies and similar technologies to:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Maintain your session and authentication state</li>
            <li style={liStyle}>Remember your preferences and settings</li>
            <li style={liStyle}>Analyze site usage and performance</li>
            <li style={liStyle}>Provide personalized content and recommendations</li>
          </ul>
          <p style={pStyle}>You can control cookies through your browser settings, but disabling them may affect the functionality of our Service.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Children's Privacy</h2>
          <p style={pStyle}>Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. International Data Transfers</h2>
          <p style={pStyle}>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your personal information in accordance with applicable data protection laws.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Changes to This Privacy Policy</h2>
          <p style={pStyle}>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Service after any modifications indicates your acceptance of the updated Privacy Policy.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Contact Information</h2>
          <p style={pStyle}>If you have any questions about this Privacy Policy or our practices, please contact us at:</p>
          <div>
            <p style={pStyle}><strong>Email:</strong> hello@grokinterviews.org</p>
            <p style={pStyle}><strong>Website:</strong> www.grokinterviews.org</p>
          </div>
          <p style={pStyle}>For any questions or to exercise your rights regarding your data, please contact us using the email address above.</p>
        </section>
      </div>
    </div>
  )
}
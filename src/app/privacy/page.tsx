export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to GrokInterviews ("we," "our," or "us"). This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our AI-powered interview preparation 
              platform and related services (the "Service").
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with 
              this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
            <p>When you create an account through Google OAuth, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your Google profile information (name, email address, profile picture)</li>
              <li>Google account ID for authentication purposes</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.2 Usage and Activity Data</h3>
            <p>We automatically collect information about your interaction with our Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Progress Tracking:</strong> Your completion status across 81,499+ interview questions and 2,394 technical topics</li>
              <li><strong>Activity Data:</strong> Learning sessions, time spent on topics, question attempts, and study patterns</li>
              <li><strong>Bookmarks:</strong> Questions and resources you save for later review</li>
              <li><strong>Preferences:</strong> Your learning preferences, difficulty settings, and AI model choices</li>
              <li><strong>Search Queries:</strong> Topics and questions you search for within our platform</li>
              <li><strong>Performance Analytics:</strong> Your progress across different domains (AI & ML, Web Development, System Design, DSA, Machine Learning)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.3 Technical Data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Session data and cookies</li>
              <li>Log data including access times and pages visited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            
            <h3 className="text-xl font-medium mb-3">3.1 Core Service Functionality</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Providing access to our library of 3.6+ million learning resources</li>
              <li>Generating personalized AI-powered answers using Groq API</li>
              <li>Tracking your progress across topics and categories</li>
              <li>Creating personalized learning recommendations</li>
              <li>Maintaining your bookmarks and study lists</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">3.2 Personalization and Analytics</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Customizing content based on your learning preferences</li>
              <li>Providing progress analytics and performance insights</li>
              <li>Generating activity grids showing learning patterns</li>
              <li>Recommending study paths and next topics</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">3.3 Service Improvement</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Analyzing usage patterns to improve our platform</li>
              <li>Optimizing our AI models and content recommendations</li>
              <li>Identifying and fixing technical issues</li>
              <li>Developing new features based on user behavior</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium mb-3">4.1 Third-Party Services</h3>
            <p>We share information with the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Google:</strong> For authentication services (OAuth)</li>
              <li><strong>Groq:</strong> For AI-powered answer generation (questions and context only, no personal data)</li>
              <li><strong>Supabase:</strong> For database hosting and real-time features</li>
              <li><strong>Vercel:</strong> For application hosting and analytics</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">4.2 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to valid legal requests.</p>

            <h3 className="text-xl font-medium mb-3 mt-6">4.3 Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
            
            <h3 className="text-xl font-medium mb-3">5.1 Data Storage</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your data is stored securely using Supabase (PostgreSQL) with Row Level Security (RLS)</li>
              <li>We implement database encryption and secure access controls</li>
              <li>Real-time data synchronization with encrypted connections</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">5.2 Security Measures</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Secure authentication using Google OAuth 2.0</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring systems</li>
              <li>Data backup and recovery procedures</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">5.3 Data Retention</h3>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. 
              You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-medium mb-3">6.1 Account Control</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> View and manage your profile information</li>
              <li><strong>Update:</strong> Modify your preferences and settings</li>
              <li><strong>Export:</strong> Request a copy of your data</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">6.2 Privacy Settings</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Control your learning preferences and AI model selection</li>
              <li>Manage bookmark and progress visibility</li>
              <li>Opt out of certain data collection features</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">6.3 Communication</h3>
            <p>
              We currently do not send marketing emails. All communication is service-related and necessary 
              for platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
            <p>We use essential cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze site usage and performance</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings, but disabling them may affect 
              the functionality of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If you become aware that a child has provided 
              us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your personal information in 
              accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              Your continued use of the Service after any modifications indicates your acceptance of the 
              updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy or our practices, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <p><strong>Email:</strong> hello@grokinterviews.org</p>
              <p><strong>Website:</strong> www.grokinterviews.org</p>
            </div>
            <p className="mt-4">
              For any questions or to exercise your rights regarding your data, please contact us using 
              the email address above.
            </p>
          </section>

          <section className="border-t pt-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">Summary</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <p className="font-medium mb-2">GrokInterviews Privacy Commitment:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>We collect only necessary data to provide personalized interview preparation</li>
                <li>Your progress data and preferences are used solely to enhance your learning experience</li>
                <li>We use secure, industry-standard practices to protect your information</li>
                <li>You have full control over your data and can request deletion at any time</li>
                <li>We're transparent about our data practices and third-party integrations</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 
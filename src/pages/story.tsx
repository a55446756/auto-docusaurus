import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const CheckCircleIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const DocumentIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);

const BanIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
    <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
  </svg>
);

const TrendingIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default function Story(): JSX.Element {
  return (
    <Layout title="Our Story" description="How Eolas Solutions built FiOS to get their weekends back.">
      {/* Hero */}
      <section className="story-hero-section">
        <div className="story-hero-container">
          <span className="story-label">Case Study</span>
          <h1>From lost weekends to <span>winning more work</span></h1>
          <p className="story-hero-intro">How a defence veteran's frustration with opportunity hunting led to building a platform that changed how Eolas Solutions—and now other consultancies—scale without scaling admin.</p>
        </div>
      </section>

      {/* Profile */}
      <section className="profile-section">
        <div className="profile-container">
          <span className="section-eyebrow">Meet the Founder</span>
          <h2 className="section-heading">Patrick O'Neill CSC</h2>
          <div className="profile-card">
            <div className="profile-image">
              <span className="profile-initials">PO</span>
            </div>
            <div className="profile-content">
              <h3>Patrick O'Neill CSC</h3>
              <p className="profile-title">Director, Eolas Solutions</p>
              <p className="profile-bio">Patrick is a strategy and operations practitioner with a career delivering outcomes of domestic and international significance. He served as Chief of Operations for the ADF's support to the 2018 Commonwealth Games, APEC 2018 in Papua New Guinea, and Talisman Sabre 17—a multinational exercise involving over 33,000 personnel.</p>
              <p className="profile-bio" style={{marginTop: '1rem'}}>As a consultant, Patrick has worked with Defence, Treasury, the Australian Electoral Commission, and ACT Emergency Services. He founded Eolas Solutions in 2024 with one goal: to work on impact projects that improve the lives of others.</p>
              <div className="profile-credentials">
                <span className="credential-tag">15+ Years Defence</span>
                <span className="credential-tag">ANU Masters</span>
                <span className="credential-tag">Conspicuous Service Cross</span>
                <span className="credential-tag">Operations Expert</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="problem-section">
        <div className="problem-container">
          <span className="section-eyebrow">The Problem</span>
          <h2 className="section-heading">Monday morning, the old way</h2>
          <p className="content-text">Log into AusTender. Check for opportunities. Download the zip files. Open them. Read. Note the details in a spreadsheet.</p>
          <p className="content-text">Next portal. Another login. Two-factor authentication. Wait for the code. More opportunities. More documents. More rows in the spreadsheet.</p>
          <p className="content-text">Check the shared inbox. Has someone already captured this one? You're not sure. Add it anyway. It's nearly lunch. You haven't started work yet—you're still looking for it.</p>
          <p className="content-text">A tender catches your eye. Good fit. Right location. Right skills. Who's available? You check the resource spreadsheet. Last updated three weeks ago. You message the team. Wait. Chase. Piece it together.</p>
          <p className="content-text" style={{fontWeight: 600, color: 'var(--color-navy)'}}>Friday, 4pm. Bid due Monday. You know how this weekend ends.</p>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-card-icon"><ClockIcon /></div>
              <h4>Lost weekends</h4>
              <p>You started this business to do great work—not to spend Saturdays and Sundays compiling bids.</p>
            </div>
            <div className="pain-card">
              <div className="pain-card-icon"><DocumentIcon /></div>
              <h4>Scattered information</h4>
              <p>Spreadsheets worked at five people. At twenty, the cracks are showing. At fifty, it's unsustainable.</p>
            </div>
            <div className="pain-card">
              <div className="pain-card-icon"><BanIcon /></div>
              <h4>Missed opportunities</h4>
              <p>You have access to multiple panels, but really only review your best three. Opportunities hide in portals you forgot to check.</p>
            </div>
            <div className="pain-card">
              <div className="pain-card-icon"><TrendingIcon /></div>
              <h4>Growth ceiling</h4>
              <p>The choice: hire more assistants and squeeze margins, or stop growing. Neither option is good.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote 1 */}
      <div className="highlight-quote">
        <blockquote>"You're good at what you do. You win work because your people are talented. You don't need help consulting—<span>you need help with the machinery around it.</span>"</blockquote>
        <p className="quote-attribution">— The FiOS Philosophy</p>
      </div>

      {/* Results */}
      <section className="results-section">
        <div className="results-container">
          <span className="section-eyebrow">The Results</span>
          <h2 className="section-heading">Monday morning with FiOS</h2>
          <p className="content-text" style={{marginBottom: '2rem'}}>All your opportunities are compiled, organised, aligned to candidates—waiting. Each one has already been analysed. Location, work type, requirements, deadlines. Summarised so you're not wading through 50-page PDFs to understand what's being asked.</p>
          <div className="results-grid">
            <div className="result-card">
              <div className="result-number">3</div>
              <p className="result-label">Steps</p>
              <p className="result-desc">Opportunity → Candidates → Bid document</p>
            </div>
            <div className="result-card">
              <div className="result-number">1</div>
              <p className="result-label">Platform</p>
              <p className="result-desc">Everything in one place. No runaround.</p>
            </div>
            <div className="result-card">
              <div className="result-number">0</div>
              <p className="result-label">Lost Weekends</p>
              <p className="result-desc">Bid on work you'd have spent Saturday compiling</p>
            </div>
          </div>
          <ul className="benefits-list">
            <li>
              <div className="benefit-icon"><CheckCircleIcon /></div>
              <div className="benefit-content">
                <h4>Submit while competitors are still logging in</h4>
                <p>You found more. You understood faster. You responded quicker. You bid on work you'd have missed or spent the weekend compiling.</p>
              </div>
            </li>
            <li>
              <div className="benefit-icon"><CheckCircleIcon /></div>
              <div className="benefit-content">
                <h4>Candidates matched, ranked by relevance</h4>
                <p>A tender catches your eye. You click into it. Candidates have already been matched—ranked by skills, clearances, and availability. Select your team in clicks.</p>
              </div>
            </li>
            <li>
              <div className="benefit-icon"><CheckCircleIcon /></div>
              <div className="benefit-content">
                <h4>Bids assembled, not started from scratch</h4>
                <p>A full bid document generates—opportunity details, candidate profiles, CVs structured to requirements. You're putting finishing touches on it, not building it from nothing.</p>
              </div>
            </li>
            <li>
              <div className="benefit-icon"><CheckCircleIcon /></div>
              <div className="benefit-content">
                <h4>Winning is a numbers game—now you can play it</h4>
                <p>The competition is tighter. You still want to submit quality bids. Now you can bid on more opportunities without burning out your team.</p>
              </div>
            </li>
            <li>
              <div className="benefit-icon"><CheckCircleIcon /></div>
              <div className="benefit-content">
                <h4>Scale without scaling admin</h4>
                <p>Eolas grew to more panels and more opportunities without hiring more admin staff. The team stays focused on value-creating work. Employee happiness improved.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Quote 2 */}
      <div className="highlight-quote">
        <blockquote>"We didn't set out to build a product for others. We just wanted our weekends back. <span>Now we're helping other consultancies get theirs.</span>"</blockquote>
        <p className="quote-attribution">— Patrick O'Neill, Director, Eolas Solutions</p>
      </div>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to see it for yourself?</h2>
        <p>No six-month implementation. No IT nightmare. You'll be operational in weeks, not months.</p>
        <div>
          <Link to="/#contact" className="btn btn-primary">Let's Talk <ArrowIcon /></Link>
          <Link to="/#solutions" className="btn btn-secondary">See the Platform</Link>
        </div>
      </section>
    </Layout>
  );
}

import React, { useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Scroll handler for navbar links
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Hook to handle hash navigation on page load
function useHashScroll() {
  useEffect(() => {
    // Handle initial hash on page load
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => scrollToSection(hash), 100);
    }

    // Handle navbar clicks
    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        const label = link.textContent?.trim();
        
        // Map navbar labels to section IDs
        const sectionMap: { [key: string]: string } = {
          'About': 'about',
          'Solutions': 'solutions',
          'Getting Started': 'getting-started',
          'Book a Demo': 'contact',
        };
        
        if (label && sectionMap[label] && (href === '/' || href === '')) {
          e.preventDefault();
          scrollToSection(sectionMap[label]);
          window.history.pushState(null, '', `/#${sectionMap[label]}`);
        }
      }
    };

    document.addEventListener('click', handleNavClick);
    return () => document.removeEventListener('click', handleNavClick);
  }, []);
}

// Icons as inline SVGs
const CheckIcon = () => (
  <svg fill="currentColor" viewBox="0 0 20 20" width="12" height="12">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
);

const SearchIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="28" height="28">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="28" height="28">
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
  </svg>
);

const DocumentIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="28" height="28">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const ServerIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
  </svg>
);

const LockIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
);

const CogIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const SupportIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
  </svg>
);

const AuditIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

export default function Home(): JSX.Element {
  useHashScroll();
  
  return (
    <Layout
      title="See more. Bid more. Win more."
      description="The business development platform that lets growing consultancies scale without scaling admin."
    >
      {/* Hero Section */}
      <section className="hero-section">
        {/* Video Background */}
        <video className="hero-video-bg" autoPlay muted loop playsInline>
          <source src="/img/assets/fioshero.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay"></div>
        
        <div className="hero-container">
          <div className="hero-content">
            <h1>See more. Bid more. <span>Win more.</span></h1>
            <p>The business development platform that lets growing consultancies scale without scaling admin. Find opportunities faster, match talent instantly, and submit bids while your competitors are still logging in.</p>
            <div className="hero-buttons">
              <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>
                Book a Demo
                <ArrowIcon />
              </a>
              <a href="#solutions" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('solutions'); }}>See How It Works</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-header">
                <span className="hero-card-dot dot-green"></span>
                <span className="hero-card-dot dot-yellow"></span>
                <span className="hero-card-dot dot-red"></span>
              </div>
              <div className="hero-card-row">
                <span className="hero-card-label">Open Opportunities</span>
                <span className="hero-card-value">117</span>
              </div>
              <div className="hero-card-row">
                <span className="hero-card-label">Due This Week</span>
                <span className="hero-card-value">20</span>
              </div>
              <div className="hero-card-row">
                <span className="hero-card-label">Talent Matched</span>
                <span className="hero-card-badge">60 candidates</span>
              </div>
              <div className="hero-card-row">
                <span className="hero-card-label">Bids in Progress</span>
                <span className="hero-card-value">17</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-grid">
          <div className="about-content">
            <h2>Built by consultants, for consultants</h2>
            <p>We built FiOS because we lived the problem.</p>
            <p>Eolas started as a small consultancy in Canberra. We were good at what we did. But we were drowning in the admin of finding and winning work. Monday mornings lost to portal logins. Weekends lost to bid compilation. Talented people doing data entry instead of delivery.</p>
            <p>So we built something to fix it. First for ourselves. Then for others like us. FiOS isn't built by people who read about your problems in a requirements document—it's built by people who've lived them.</p>
            <div className="about-values">
              <div className="value-item">
                <div className="value-icon"><CheckIcon /></div>
                <span className="value-text">See quicker</span>
              </div>
              <div className="value-item">
                <div className="value-icon"><CheckIcon /></div>
                <span className="value-text">Bid quicker</span>
              </div>
              <div className="value-item">
                <div className="value-icon"><CheckIcon /></div>
                <span className="value-text">Win quicker</span>
              </div>
              <div className="value-item">
                <div className="value-icon"><CheckIcon /></div>
                <span className="value-text">Scale without scaling admin</span>
              </div>
            </div>
          </div>
          <div className="about-visual">
            <div className="about-image">
              {/* Replace with actual image when available */}
              <img src="/img/assets/eolas.jpg" alt="Eolas Solutions" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.innerHTML = '<div class="about-image-placeholder"><h3>Eolas Solutions</h3><span>Canberra, Australia</span></div>';
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Banner */}
      <div className="mission-banner">
        <blockquote>
          "To take the <span>administrative weight</span> off your shoulders so you can focus on the work that matters—<span>winning opportunities</span> and <span>delivering for your clients.</span>"
        </blockquote>
      </div>

      {/* Story Hook Section */}
      <section className="story-hook-section" id="story-hook">
        <div className="story-hook-grid">
          <div className="story-hook-content">
            <p className="section-label">Is This You?</p>
            <h2 className="section-title">Monday morning, the old way</h2>
            <p className="story-hook-text">Log into AusTender. Download the zip files. Read. Note the details in a spreadsheet. Next portal. Another login. Two-factor authentication. Wait for the code. More opportunities. More documents. More rows in the spreadsheet.</p>
            <p className="story-hook-text">It's nearly lunch. You haven't started work yet—you're still looking for it. A tender catches your eye. Good fit. Who's available? You check the resource spreadsheet. Last updated three weeks ago.</p>
            <p className="story-hook-text" style={{fontWeight: 600, color: 'var(--color-navy)'}}>Friday, 4pm. Bid due Monday. You know how this weekend ends.</p>
            <Link to="/story" className="btn btn-secondary story-btn">
              Read How We Fixed It
              <ArrowIcon />
            </Link>
          </div>
          <div className="story-hook-stats">
            <div className="stat-card">
              <div className="stat-before">
                <span className="stat-label">The Old Way</span>
                <span className="stat-value bad">Still logging in</span>
                <span className="stat-desc">While competitors submit</span>
              </div>
              <div className="stat-arrow">→</div>
              <div className="stat-after">
                <span className="stat-label">With FiOS</span>
                <span className="stat-value good">Already bidding</span>
                <span className="stat-desc">Opportunities waiting, analysed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-before">
                <span className="stat-label">The Old Way</span>
                <span className="stat-value bad">50-page PDFs</span>
                <span className="stat-desc">Wading through documents</span>
              </div>
              <div className="stat-arrow">→</div>
              <div className="stat-after">
                <span className="stat-label">With FiOS</span>
                <span className="stat-value good">Instant summary</span>
                <span className="stat-desc">Location, requirements, deadline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="modules-section" id="solutions">
        <div className="modules-container">
          <div className="section-header">
            <p className="section-label">Three Modules. One Platform.</p>
            <h2 className="section-title">Your business development, end-to-end</h2>
            <p className="section-subtitle">FiOS handles everything from finding opportunities to assembling bids. Three steps. One platform. No runaround.</p>
          </div>

          <div className="modules-grid">
            {/* Module 1: Opportunity Tracker */}
            <div className="module-card">
              <div className="module-content">
                <div className="module-icon blue" style={{color: 'var(--color-accent)'}}>
                  <SearchIcon />
                </div>
                <h3 className="module-title">Opportunity Tracker</h3>
                <p className="module-tagline">Every opportunity. One place.</p>
                <p className="module-description">FiOS automatically pulls opportunities from portals, emails, and websites. Each one is analysed and summarised: location, work type, requirements, deadlines. You see what matters without wading through 50-page PDFs.</p>
                <ul className="module-features">
                  <li>Consolidates all sources into a single, organised dashboard</li>
                  <li>AI-powered analysis extracts key details automatically</li>
                  <li>Executive summaries so you understand what's being asked—fast</li>
                  <li>Due date visibility for planning your week</li>
                  <li>Never miss an opportunity hiding in a portal you forgot to check</li>
                </ul>
              </div>
              <div className="module-visual">
                <img src="/img/assets/opptracker.png" alt="Opportunity Tracker" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = `
                    <div class="module-visual-header">
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      Opportunity Pipeline
                    </div>
                    <div class="module-visual-row"><span>Defence ICT Support</span><span class="module-visual-status status-review">Review</span></div>
                    <div class="module-visual-row"><span>ATO Data Migration</span><span class="module-visual-status status-active">Bid Dev</span></div>
                    <div class="module-visual-row"><span>DTA Advisory Services</span><span class="module-visual-status status-submitted">Submitted</span></div>
                    <div class="module-visual-row"><span>Home Affairs Cyber</span><span class="module-visual-status status-review">Review</span></div>
                  `;
                }} />
              </div>
            </div>

            {/* Module 2: Talent Wall */}
            <div className="module-card reverse">
              <div className="module-content">
                <div className="module-icon cyan" style={{color: 'var(--color-sage)'}}>
                  <UsersIcon />
                </div>
                <h3 className="module-title">Talent Wall</h3>
                <p className="module-tagline">Your people, organised.</p>
                <p className="module-description">Upload CVs once. FiOS extracts skills, experience, clearances, and availability. When an opportunity lands, candidates are matched instantly—ranked by relevance.</p>
                <ul className="module-features">
                  <li>Automated profile creation from CV uploads</li>
                  <li>Skills, clearances, and experience extracted automatically</li>
                  <li>Instant candidate matching when opportunities arrive</li>
                  <li>Track availability and relationship status</li>
                  <li>Never let a key candidate miss being put forward again</li>
                </ul>
              </div>
              <div className="module-visual">
                <img src="/img/assets/talentwall.png" alt="Talent Wall" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = `
                    <div class="module-visual-header">
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      Matched Candidates
                    </div>
                    <div class="module-visual-row"><span>Sarah Chen · NV1</span><span class="module-visual-status status-active">95% Match</span></div>
                    <div class="module-visual-row"><span>Marcus Webb · NV2</span><span class="module-visual-status status-active">87% Match</span></div>
                    <div class="module-visual-row"><span>Priya Sharma · Baseline</span><span class="module-visual-status status-review">72% Match</span></div>
                    <div class="module-visual-row"><span>James Liu · NV1</span><span class="module-visual-status status-active">68% Match</span></div>
                  `;
                }} />
              </div>
            </div>

            {/* Module 3: Bid Builder */}
            <div className="module-card">
              <div className="module-content">
                <div className="module-icon indigo" style={{color: 'var(--color-terracotta)'}}>
                  <DocumentIcon />
                </div>
                <h3 className="module-title">Bid Builder</h3>
                <p className="module-tagline">Bids assembled in clicks.</p>
                <p className="module-description">Select an opportunity. Select your candidates. FiOS generates a formatted, compliant bid document—pulling in opportunity details, candidate profiles, and CVs structured to requirements.</p>
                <ul className="module-features">
                  <li>Opportunity details and matched candidates pre-loaded</li>
                  <li>Compliant bid documents generated automatically</li>
                  <li>Customisable sections and content</li>
                  <li>CVs restructured to match opportunity requirements</li>
                  <li>Export to PDF or Word—ready for finishing touches</li>
                </ul>
              </div>
              <div className="module-visual">
                <img src="/img/assets/bidbuilder.png" alt="Bid Builder" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = `
                    <div class="module-visual-header">
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Bid Document
                    </div>
                    <div class="module-visual-row"><span>Executive Summary</span><span class="module-visual-status status-active">Generated</span></div>
                    <div class="module-visual-row"><span>Candidate Profiles</span><span class="module-visual-status status-active">Generated</span></div>
                    <div class="module-visual-row"><span>Technical Approach</span><span class="module-visual-status status-review">Editing</span></div>
                    <div class="module-visual-row"><span>Compliance Matrix</span><span class="module-visual-status status-active">Generated</span></div>
                  `;
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section" id="how-it-works">
        <div className="workflow-container">
          <div className="section-header">
            <p className="section-label">The Workflow</p>
            <h2 className="section-title">Monday morning with FiOS</h2>
            <p className="section-subtitle">Your opportunities are compiled, organised, and aligned to candidates—waiting. You're submitting bids while your competitors are still logging in.</p>
          </div>

          <div className="flow-diagram">
            <div className="flow-step">
              <div className="flow-step-icon"><SearchIcon /></div>
              <p className="flow-step-title">Opportunity arrives</p>
              <p className="flow-step-desc">Analysed and added to dashboard</p>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <div className="flow-step-icon"><ClipboardIcon /></div>
              <p className="flow-step-title">Candidates matched</p>
              <p className="flow-step-desc">Ranked by skills and availability</p>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <div className="flow-step-icon"><CheckCircleIcon /></div>
              <p className="flow-step-title">Select your team</p>
              <p className="flow-step-desc">One click to confirm</p>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <div className="flow-step-icon"><DocumentIcon /></div>
              <p className="flow-step-title">Bid generated</p>
              <p className="flow-step-desc">Ready for finishing touches</p>
            </div>
          </div>

          <p className="flow-description">You found more. You understood faster. You responded quicker. You bid on work you'd have missed—or spent the weekend compiling.</p>
        </div>
      </section>

      {/* Technical Section */}
      <section className="technical-section">
        <div className="technical-container">
          <div className="section-header">
            <p className="section-label">The Technical Stuff</p>
            <h2 className="section-title">Your data, your control</h2>
            <p className="section-subtitle">We take security and ownership seriously. Here's how we set things up.</p>
          </div>

          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-card-icon"><ServerIcon /></div>
              <h3>Dedicated Infrastructure</h3>
              <p>You get your own server and database. Your data isn't mixed with anyone else's—ever.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-icon"><LockIcon /></div>
              <h3>Full Ownership</h3>
              <p>You own your data, full stop. Role-based access controls and secure invitation codes keep it protected.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-icon"><ShieldIcon /></div>
              <h3>Your Domain</h3>
              <p>Hosted under your domain with standard encryption, security protocols, and full audit trails.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-icon"><CogIcon /></div>
              <h3>Customisable</h3>
              <p>Bid templates, AI prompts, workflows, and integrations—all configured to match how you work.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-icon"><SupportIcon /></div>
              <h3>Ongoing Support</h3>
              <p>Setup, training, documentation, and access to our support team. Plus regular platform updates.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-icon"><AuditIcon /></div>
              <h3>Audit Trails</h3>
              <p>Full version control and change tracking for compliance. Know who did what, and when.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="getting-started-section" id="getting-started">
        <div className="getting-started-container">
          <div className="section-header">
            <p className="section-label">Getting Started</p>
            <h2 className="section-title">Operational in weeks, not months</h2>
            <p className="section-subtitle">No six-month implementation. No IT nightmare. We handle the setup—you provide your sources and CVs.</p>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <p className="timeline-week">Week 1</p>
              <p className="timeline-title">Discovery</p>
              <p className="timeline-desc">We learn how you work. You share your opportunity sources and upload your CVs.</p>
            </div>
            <div className="timeline-item">
              <p className="timeline-week">Weeks 2–3</p>
              <p className="timeline-title">Configuration</p>
              <p className="timeline-desc">We configure your FiOS environment and connect your sources.</p>
            </div>
            <div className="timeline-item">
              <p className="timeline-week">Week 4</p>
              <p className="timeline-title">Go Live</p>
              <p className="timeline-desc">Training, handover, and you're operational.</p>
            </div>
            <div className="timeline-item">
              <p className="timeline-week">Ongoing</p>
              <p className="timeline-title">Real Support</p>
              <p className="timeline-desc">From people who understand your business—not a helpdesk.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <div className="section-header">
            <p className="section-label">Get in Touch</p>
            <h2 className="section-title">We'd rather show you than tell you</h2>
          </div>
          <div className="contact-content">
            <p>If you want to see how FiOS could work for your business, get in touch for a demo. No pressure. No hard sell. Just a conversation about whether this might be useful for you.</p>
            <div className="contact-card">
              <h3>Eolas Solutions</h3>
              <a href="mailto:fios@eolassolutions.com.au" className="contact-email">fios@eolassolutions.com.au</a>
              <p className="contact-note">"Built in Canberra by consultants, for consultants."</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

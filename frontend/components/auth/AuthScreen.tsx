'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConstellationCanvas } from './ConstellationCanvas';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Shield, X, ArrowRight, Terminal } from 'lucide-react';

interface AuthScreenProps {
  onSuccessRedirect: () => void;
  onEnterWorkspace: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onSuccessRedirect, 
  onEnterWorkspace,
  isAuthenticated,
  onLogout
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleTiltChange = useCallback((x: number, y: number) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--tilt-x', `${y * 5}deg`);
      containerRef.current.style.setProperty('--tilt-y', `${x * -8}deg`);
    }
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-y-auto bg-[#080807] cinematic-theme relative scroll-smooth selection:bg-[#65f4a6]/30"
    >
      {/* Background Star field Constellation */}
      <ConstellationCanvas onTiltChange={handleTiltChange} />
      <div className="grain" aria-hidden="true" />

      {/* Header Nav */}
      <header className="nav relative z-10" aria-label="Primary navigation">
        <a className="brand flex items-center gap-3 font-semibold text-lg" href="#">
          <span className="brand-mark" aria-hidden="true"></span>
          <span className="tracking-tight text-white font-space">Context AI</span>
        </a>
        <div className="nav-links flex items-center gap-8">
          <a href="#workflow" className="text-white/60 hover:text-white transition-colors">Workflow</a>
          <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
          <a href="#demo" className="text-white/60 hover:text-white transition-colors">Demo</a>
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={onEnterWorkspace}
              className="nav-cta text-sm font-semibold cursor-pointer"
            >
              Go to Workspace
            </button>
            <button 
              onClick={onLogout}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => openAuth('login')}
              className="text-white/80 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="nav-cta text-sm font-semibold cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero" aria-label="Context AI hero">
        <div className="hero-inner relative">
          <div className="hero-copy">
            <div className="eyebrow flex items-center gap-2 mb-2 font-space">
              Grounded answers from your PDFs
            </div>
            <h1 className="font-space font-bold leading-none tracking-tight text-white">
              Ask every document.
            </h1>
            <p className="hero-lede text-white/80 mt-4 max-w-xl">
              Upload your files, let intent-based retrieval find the exact context, and get clear answers
              backed by precise page-level citations instead of guesswork.
            </p>
            <div className="actions flex items-center gap-4 mt-8">
              <button 
                onClick={isAuthenticated ? onEnterWorkspace : () => openAuth('signup')}
                className="primary-btn text-[#080807] bg-[#65f4a6] hover:bg-[#52e294] transition-colors cursor-pointer"
              >
                {isAuthenticated ? 'Go to Workspace' : 'Launch app'}
              </button>
              <a 
                href="#workflow" 
                className="secondary-btn flex items-center justify-center text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                See retrieval
              </a>
            </div>
            <div className="hero-foot mt-12 flex items-center gap-6" aria-label="Product highlights">
              <span className="flex items-center gap-2 text-white/70 text-sm">PDF parsing</span>
              <span className="flex items-center gap-2 text-white/70 text-sm">Vector search</span>
              <span className="flex items-center gap-2 text-white/70 text-sm">Cited answers</span>
            </div>
          </div>

          {/* Interactive Floating 3D Cards Stage */}
          <div className="stage" aria-hidden="true">
            <div className="document-system">
              <div className="vector-ring"></div>
              <div className="token token-chunk">chunk</div>
              <div className="token token-embed">embed</div>
              <div className="token token-rank">rank</div>
              <div className="token token-cite">cite</div>

              <article className="pdf-sheet three"></article>
              <article className="pdf-sheet two"></article>
              <article className="pdf-sheet one">
                <span className="sheet-kicker">PDF</span>
                <div className="doc-line"></div>
                <div className="doc-line med"></div>
                <div className="doc-line short"></div>
                <div className="highlight"></div>
                <div className="doc-line"></div>
                <div className="doc-line med"></div>
              </article>


            </div>
          </div>
        </div>


      </section>

      {/* Workflow Section */}
      <section id="workflow" className="section light relative z-10">
        <div className="section-inner">
          <div className="section-head mb-12">
            <div>
              <h2 className="font-space font-bold text-4xl text-[#080807]">Retrieval that feels visible.</h2>
              <p className="text-[#080807]/70 mt-4 max-w-xl">
                Every answer moves through a legible pipeline: parse pages, chunk the text,
                retrieve the best matches, then respond with citations.
              </p>
            </div>
          </div>

          <div className="workflow">
            <div className="pipeline relative" aria-label="RAG workflow diagram">
              <div className="beam one"></div>
              <div className="beam two"></div>
              <div className="beam three"></div>
              <div className="pipeline-node node-a">
                <strong>Upload</strong>
                <span>PDFs become searchable document blocks.</span>
              </div>
              <div className="pipeline-node node-b">
                <strong>Embed</strong>
                <span>Chunks turn into vectors for semantic recall.</span>
              </div>
              <div className="pipeline-node node-c">
                <strong>Retrieve</strong>
                <span>Relevant passages are ranked before generation.</span>
              </div>
              <div className="pipeline-node node-d">
                <strong>Answer</strong>
                <span>Responses include pages, snippets, and confidence cues.</span>
              </div>
            </div>

            <div className="insight-panel flex flex-col gap-4">
              <div className="upload-box bg-white border border-[#080807]/12 rounded-lg p-6 shadow-md">
                <div className="upload-top flex items-center justify-between gap-4 mb-4">
                  <span className="mini-label text-xs font-semibold text-[#080807]/50 tracking-wider">Document intake</span>
                  <span className="pill text-xs border border-[#080807]/12 rounded-full px-3 py-1 font-semibold text-[#080807]">Drag PDF</span>
                </div>
                <div className="upload-card border border-dashed border-[#080807]/20 rounded-lg p-8 bg-[#65f4a6]/5 text-center">
                  <div>
                    <span className="upload-icon inline-grid place-items-center w-12 h-12 bg-[#080807] text-[#65f4a6] rounded-lg font-bold shadow-sm mb-4">PDF</span>
                    <strong className="block text-lg text-[#080807] font-semibold">Board minutes Q2.pdf</strong>
                    <span className="text-sm text-[#080807]/60">Indexed into 186 retrievable chunks</span>
                  </div>
                </div>
              </div>

              <div className="response-box bg-[#11100d] border border-white/12 rounded-lg p-6 shadow-md text-white">
                <span className="mini-label text-xs font-semibold text-white/50 tracking-wider uppercase">Generated answer</span>
                <div className="answer-row mt-4 flex gap-3">
                  <span className="dot w-3 h-3 bg-[#65f4a6] rounded-full mt-1.5 shrink-0"></span>
                  <span className="text-white/80 leading-relaxed">
                    The board approved the pricing change after reviewing enterprise
                    conversion and support impact. Sources: p.6, p.9, p.11.
                  </span>
                </div>
                <div className="answer-row mt-3 flex gap-3">
                  <span className="dot w-3 h-3 bg-[#65f4a6] rounded-full mt-1.5 shrink-0"></span>
                  <span className="text-white/80 leading-relaxed">
                    The answer stays tied to the uploaded file, so teams can inspect the
                    evidence before acting.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section dark relative z-10 bg-[#12110f]">
        <div className="section-inner">
          <div className="section-head mb-12">
            <div>
              <h2 className="font-space font-bold text-4xl text-white">Built for people who read hard documents.</h2>
              <p className="text-white/60 mt-4 max-w-xl">
                Legal, finance, research, sales, and operations teams get quick answers
                without losing the trail back to the source.
              </p>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card border border-white/10 bg-white/5 p-6 rounded-lg hover:border-[#65f4a6]/40 transition-all hover:-translate-y-1">
              <span className="feature-index inline-grid place-items-center w-10 h-10 bg-white text-[#080807] rounded-lg font-bold mb-6">01</span>
              <h3 className="font-space font-bold text-xl text-white mb-2">Source-first answers</h3>
              <p className="text-white/70 text-sm leading-relaxed">Every response points to the pages and passages used to form the answer.</p>
            </article>
            <article className="feature-card border border-white/10 bg-white/5 p-6 rounded-lg hover:border-[#65f4a6]/40 transition-all hover:-translate-y-1">
              <span className="feature-index inline-grid place-items-center w-10 h-10 bg-[#65f4a6] text-[#080807] rounded-lg font-bold mb-6">02</span>
              <h3 className="font-space font-bold text-xl text-white mb-2">Semantic search</h3>
              <p className="text-white/70 text-sm leading-relaxed">Ask naturally and retrieve meaning, not just exact keyword matches.</p>
            </article>
            <article className="feature-card border border-white/10 bg-white/5 p-6 rounded-lg hover:border-[#65f4a6]/40 transition-all hover:-translate-y-1">
              <span className="feature-index inline-grid place-items-center w-10 h-10 bg-[#ffcc63] text-[#080807] rounded-lg font-bold mb-6">03</span>
              <h3 className="font-space font-bold text-xl text-white mb-2">Multi-PDF memory</h3>
              <p className="text-white/70 text-sm leading-relaxed">Compare uploaded files and keep answers scoped to the active collection.</p>
            </article>
            <article className="feature-card border border-white/10 bg-white/5 p-6 rounded-lg hover:border-[#65f4a6]/40 transition-all hover:-translate-y-1">
              <span className="feature-index inline-grid place-items-center w-10 h-10 bg-[#ff6b4a] text-white rounded-lg font-bold mb-6">04</span>
              <h3 className="font-space font-bold text-xl text-white mb-2">Trust controls</h3>
              <p className="text-white/70 text-sm leading-relaxed">Show confidence, missing context, and source coverage before users decide.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Demo / Terminal Section */}
      <section id="demo" className="section light relative z-10 bg-[#fbf7ef]">
        <div className="section-inner">
          <div className="section-head mb-12">
            <div>
              <h2 className="font-space font-bold text-4xl text-[#080807]">A question box with receipts.</h2>
              <p className="text-[#080807]/70 mt-4 max-w-xl">
                The interface keeps the chat fast while making the evidence stack impossible
                to miss.
              </p>
            </div>
          </div>

          <div className="showcase">
            <div className="quote-panel bg-[#11100d] border border-white/10 rounded-lg p-8 text-white flex flex-col justify-between">
              <p className="font-space text-2xl font-medium leading-normal text-white/80">
                "What obligations changed between the old vendor agreement and this PDF?"
              </p>
              <span className="text-white/50 text-sm leading-relaxed mt-8">
                The answer is generated from retrieved passages, then packaged with
                citations for review.
              </span>
            </div>

            <div className="terminal relative bg-white border border-[#080807]/12 rounded-lg p-6 min-h-[430px]">
              <div className="terminal-bar flex gap-2 mb-6">
                <i className="w-3 h-3 rounded-full bg-[#ff6b4a]" />
                <i className="w-3 h-3 rounded-full bg-[#ffcc63]" />
                <i className="w-3 h-3 rounded-full bg-[#65f4a6]" />
              </div>
              <div className="chat-line user font-mono text-sm max-w-[80%] bg-[#080807] text-[#fbf7ef] p-4 rounded-lg ml-auto mb-4 border border-[#080807]/10">
                Summarize the termination clause in plain English.
              </div>
              <div className="chat-line font-mono text-sm max-w-[80%] bg-[#080807]/5 text-[#080807] p-4 rounded-lg mr-auto mb-4 border border-[#080807]/10">
                Either party can terminate with 60 days written notice. Immediate
                termination applies after unresolved material breach.
              </div>
              <div className="chat-line user font-mono text-sm max-w-[80%] bg-[#080807] text-[#fbf7ef] p-4 rounded-lg ml-auto mb-4 border border-[#080807]/10">
                Where does it say that?
              </div>
              <div className="chat-line font-mono text-sm max-w-[80%] bg-[#080807]/5 text-[#080807] p-4 rounded-lg mr-auto mb-4 border border-[#080807]/10">
                The notice period appears on page 7. The material breach exception appears
                on page 9.
              </div>

              {/* Float source stack cards */}
              <div className="source-stack" aria-hidden="true">
                <div className="source-card bg-[#65f4a6]/95 border border-[#080807]/10 p-3 rounded-lg shadow-md">
                  <strong className="block text-xs text-[#080807] font-semibold">Source p.7</strong>
                  <span className="text-[10px] text-[#080807]/75">"60 days written notice..."</span>
                </div>
                <div className="source-card bg-[#ffcc63]/95 border border-[#080807]/10 p-3 rounded-lg shadow-md">
                  <strong className="block text-xs text-[#080807] font-semibold">Source p.9</strong>
                  <span className="text-[10px] text-[#080807]/75">"material breach remains uncured..."</span>
                </div>
                <div className="source-card bg-[#ff6b4a]/95 border border-[#080807]/10 p-3 rounded-lg shadow-md text-white">
                  <strong className="block text-xs font-semibold">Source p.11</strong>
                  <span className="text-[10px] text-white/90">"surviving obligations..."</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="cta bg-[#65f4a6] py-24 relative overflow-hidden">
        <div className="cta-inner relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="font-space font-bold text-5xl leading-tight text-[#080807] max-w-2xl">
            Turn every PDF into a cited conversation.
          </h2>
          <button 
            onClick={isAuthenticated ? onEnterWorkspace : () => openAuth('signup')}
            className="cta-action font-space text-lg font-bold bg-[#080807] text-[#fbf7ef] rounded-full w-40 h-40 flex items-center justify-center border border-[#080807]/16 cursor-pointer"
          >
            {isAuthenticated ? 'Go to App' : 'Start asking'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-8 border-t border-[#fbf7ef]/10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 text-white/50">
        <strong className="text-white tracking-tight font-space">Context AI</strong>
        <span className="text-xs text-center md:text-right">
          Designed for document intelligence, retrieval, and grounded AI answers.
        </span>
      </footer>

      {/* Authentication Modal Overlay */}
      <AnimatePresence>
        {authMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          >
            {/* Modal Body container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-[420px] max-w-full relative p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.12] backdrop-blur-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              {/* Close Button */}
              <button
                onClick={closeAuth}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Render Forms */}
              <AnimatePresence mode="wait">
                {authMode === 'login' ? (
                  <LoginForm
                    onSwitchToSignup={() => setAuthMode('signup')}
                    onSuccessRedirect={onSuccessRedirect}
                  />
                ) : (
                  <SignupForm
                    onSwitchToLogin={() => setAuthMode('login')}
                    onSuccessRedirect={onSuccessRedirect}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

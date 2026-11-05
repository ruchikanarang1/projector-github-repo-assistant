import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import RepoSelectorModal from './components/RepoSelectorModal';
import GitHubConnectModal from './components/GitHubConnectModal';

import TalkToRepo from './pages/TalkToRepo';
import Documentation from './pages/Documentation';
import InterviewPrep from './pages/InterviewPrep';
import CodeExplorer from './pages/CodeExplorer';
import Settings from './pages/Settings';

import { projectApi, authApi } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('talk');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();

    // Check for GitHub OAuth callback code in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      authApi.oauthCallback(code)
        .then((res) => {
          if (res.access_token) {
            localStorage.setItem('projector_gh_token', res.access_token);
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsGitHubModalOpen(true);
          }
        })
        .catch((err) => {
          console.error('OAuth callback error:', err);
        });
    }
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await projectApi.list();
      setProjects(list || []);

      if (list && list.length > 0) {
        const full = await projectApi.get(list[0].id);
        setCurrentProject(full);
      } else {
        try {
          const sample = await projectApi.createSample();
          setProjects([sample]);
          setCurrentProject(sample);
        } catch (e) {
          setIsRepoModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Offline or initializing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (proj) => {
    try {
      const full = await projectApi.get(proj.id);
      setCurrentProject(full);
      setProjects((prev) => {
        if (!prev.some((p) => p.id === full.id)) {
          return [full, ...prev];
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
      setCurrentProject(proj);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 flex flex-col font-sans selection:bg-[#e4d3b6] selection:text-[#09090b]">
      {/* Editorial Navbar */}
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenRepoModal={() => setIsRepoModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onNavigate={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentProject={currentProject}
        />

        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 bg-[#09090b]">
          {activeTab === 'talk' && <TalkToRepo project={currentProject} />}
          {activeTab === 'docs' && <Documentation project={currentProject} />}
          {activeTab === 'interview' && <InterviewPrep project={currentProject} />}
          {activeTab === 'code' && <CodeExplorer project={currentProject} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Codebase Switcher Modal */}
      <RepoSelectorModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        onProjectSelected={handleSelectProject}
        currentProjectId={currentProject?.id}
        projects={projects}
      />

      {/* Dedicated GitHub Account & Repository Connect Modal */}
      <GitHubConnectModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
        onProjectImported={handleSelectProject}
      />

      {/* PWA Home Screen Installation Prompt */}
      <PwaInstallPrompt />
    </div>
  );
}

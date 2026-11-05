import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import RepoSelectorModal from './components/RepoSelectorModal';

import TalkToRepo from './pages/TalkToRepo';
import Documentation from './pages/Documentation';
import InterviewPrep from './pages/InterviewPrep';
import CodeExplorer from './pages/CodeExplorer';
import Settings from './pages/Settings';

import { projectApi } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('talk'); // 'talk', 'docs', 'interview', 'code', 'settings'
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await projectApi.list();
      setProjects(list || []);

      if (list && list.length > 0) {
        // Load active project details
        const full = await projectApi.get(list[0].id);
        setCurrentProject(full);
      } else {
        // Auto-initialize sample project so the app is instantly rich and usable!
        try {
          const sample = await projectApi.createSample();
          setProjects([sample]);
          setCurrentProject(sample);
        } catch (e) {
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Could not load projects (running offline or backend starting):', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (proj) => {
    try {
      const full = await projectApi.get(proj.id);
      setCurrentProject(full);
      // update projects list if newly added
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentProject={currentProject}
        onOpenRepoModal={() => setIsModalOpen(true)}
        onNavigate={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Main Body with Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentProject={currentProject}
        />

        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          {activeTab === 'talk' && <TalkToRepo project={currentProject} />}
          {activeTab === 'docs' && <Documentation project={currentProject} />}
          {activeTab === 'interview' && <InterviewPrep project={currentProject} />}
          {activeTab === 'code' && <CodeExplorer project={currentProject} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Ingestion & Switcher Modal */}
      <RepoSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectSelected={handleSelectProject}
        currentProjectId={currentProject?.id}
        projects={projects}
      />

      {/* PWA Home Screen Installation Prompt */}
      <PwaInstallPrompt />
    </div>
  );
}

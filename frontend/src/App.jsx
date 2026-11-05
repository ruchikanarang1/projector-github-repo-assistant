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
  const [activeTab, setActiveTab] = useState('talk');
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
        const full = await projectApi.get(list[0].id);
        setCurrentProject(full);
      } else {
        try {
          const sample = await projectApi.createSample();
          setProjects([sample]);
          setCurrentProject(sample);
        } catch (e) {
          setIsModalOpen(true);
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
    <div className="min-h-screen bg-[#07080c] text-steel-200 flex flex-col font-sans selection:bg-[#2563eb] selection:text-white">
      {/* Precision Top Navbar */}
      <Navbar
        currentProject={currentProject}
        onOpenRepoModal={() => setIsModalOpen(true)}
        onNavigate={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentProject={currentProject}
        />

        <main className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0 bg-[#07080c]">
          {activeTab === 'talk' && <TalkToRepo project={currentProject} />}
          {activeTab === 'docs' && <Documentation project={currentProject} />}
          {activeTab === 'interview' && <InterviewPrep project={currentProject} />}
          {activeTab === 'code' && <CodeExplorer project={currentProject} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Mobile Tactical Bottom Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Codebase Mount Modal */}
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

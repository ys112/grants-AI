import { Project } from '@/types/project';

const STORAGE_KEY = 'grants-ai-projects';

const getInitialProjects = (): Project[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse projects from localStorage', e);
            return [];
        }
    }
    return [];
};

let projects: Project[] = getInitialProjects();

const saveProjects = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
};

export const projectStore = {
    getProjects: (): Project[] => {
        return [...projects];
    },

    getProjectById: (id: string): Project | undefined => {
        return projects.find((p) => p.id === id);
    },

    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
        const newProject: Project = {
            ...project,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        projects.push(newProject);
        saveProjects();
        return newProject;
    },

    updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project | undefined => {
        const index = projects.findIndex((p) => p.id === id);
        if (index === -1) return undefined;

        projects[index] = {
            ...projects[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        saveProjects();
        return projects[index];
    },

    deleteProject: (id: string): boolean => {
        const initialLength = projects.length;
        projects = projects.filter((p) => p.id !== id);
        if (projects.length < initialLength) {
            saveProjects();
            return true;
        }
        return false;
    },
};

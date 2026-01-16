export type ProjectDeliverable = 'classes' | 'workshops' | 'research' | 'events';
export type ProjectPriority = 'high' | 'medium' | 'low';

export interface Project {
    id: string;
    name: string;
    description: string;
    targetPopulation: string;
    focusAreas: string;
    deliverables: ProjectDeliverable[];
    fundingNeeded: {
        min: number;
        max: number;
    };
    timeline: {
        startDate: string;
        endDate: string;
    };
    expectedOutcomes: string;
    priority: ProjectPriority;
    createdAt: string;
    updatedAt: string;
}

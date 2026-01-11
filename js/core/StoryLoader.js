// js/core/StoryLoader.js
import { CONFIG } from '../config.js';

export class StoryLoader {
    constructor() {
        this.storyData = null;
    }
    
    async load() {
        try {
            const response = await fetch(CONFIG.STORY_FILE);
            if (!response.ok) throw new Error('Failed to load story');
            this.storyData = await response.json();
            this.validate();
            return this.storyData;
        } catch (e) {
            console.error('Story load error:', e);
            throw e;
        }
    }
    
    validate() {
        if (!this.storyData) throw new Error('No story data');
        if (!this.storyData.start) throw new Error('No start node');
        if (!this.storyData.nodes) throw new Error('No nodes');
    }
    
    getNode(nodeId) {
        return this.storyData.nodes[nodeId] || null;
    }
    
    getAllNodes() {
        return this.storyData.nodes;
    }
}

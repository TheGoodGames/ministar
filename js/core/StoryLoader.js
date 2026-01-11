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

        // Проверяем что есть узел "0" (стартовый)
        if (!this.storyData['0']) throw new Error('No start node (node "0")');

        console.log('✅ Story validated, nodes count:', Object.keys(this.storyData).length);
    }

    getNode(nodeId) {
        return this.storyData[nodeId] || null;
    }

    getAllNodes() {
        return this.storyData;
    }
}

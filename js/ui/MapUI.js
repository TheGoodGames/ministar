// js/ui/MapUI.js
export class MapUI {
    constructor(state, loader, engine) {
        this.state = state;
        this.loader = loader;
        this.engine = engine;
        this.screen = document.getElementById('map-screen');
        this.content = document.getElementById('map-content');
    }
    
    show() {
        this.screen.style.display = 'block';
        this.render();
    }
    
    close() {
        this.screen.style.display = 'none';
    }
    
    render() {
        const nodes = this.loader.getAllNodes();
        const current = this.state.getCurrentNode();
        this.content.innerHTML = Object.entries(nodes).map(([id, node]) => {
            const visited = this.state.isVisited(id);
            const isCurrent = id === current;
            let cls = 'map-node';
            if (isCurrent) cls += ' current';
            else if (visited) cls += ' visited';
            return `<div class="${cls}" data-node="${id}">${node.title || id}</div>`;
        }).join('');
        
        this.content.querySelectorAll('.map-node').forEach(el => {
            el.onclick = () => {
                const nodeId = el.dataset.node;
                if (this.state.isVisited(nodeId)) {
                    this.engine.goToNode(nodeId);
                    this.close();
                }
            };
        });
    }
}

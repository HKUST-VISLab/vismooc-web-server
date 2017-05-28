import * as d3 from 'd3-force';

export function forceLayout(
    graph: {
        nodes: Array<{ id: string, activeness: number, grade: number }>,
        links: Array<{ source: string, target: string, weight: number }>,
    },
    IteratorTimes: number = 100,
) {
    const link = d3.forceLink()
        .id(d => (d as any).id)
        .links(graph.links)
        .distance(100);

    const manybody = d3.forceManyBody()
        .strength(d => -Math.sqrt((d as any).activeness) * 10);
    // .distanceMin(20);

    const simulation = d3.forceSimulation()
        .force('charge', manybody)
        .force('center', d3.forceCenter());

    simulation
        .nodes(graph.nodes);

    simulation
        .force('link', link);

    for (let i = 0; i < IteratorTimes; ++i) {
        if (i % 10 === 0) {
            console.info('iter', i);
        }
        simulation.tick();
    }

    return {
        links: graph.links.map(d => ({
            source: (d.source as any).id,
            target: (d.target as any).id,
            weight: d.weight,
        })),
        nodes: graph.nodes,
    };
}

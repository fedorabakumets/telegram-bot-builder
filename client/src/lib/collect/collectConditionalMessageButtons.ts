/**
 * Helper function to collect conditional message buttons
 * @param {any[]} nodes - Array of nodes to extract conditional message buttons from
 * @returns {any[]} Array of conditional message buttons
 */
export function collectConditionalMessageButtons(nodes: any[]): any[] {
  const buttons: any[] = [];
  (nodes || []).forEach(node => {
    if (node.data.conditionalMessageButtons) {
      buttons.push(...node.data.conditionalMessageButtons);
    }
  });
  return buttons;
}

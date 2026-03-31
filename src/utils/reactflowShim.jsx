import React from "react";

const passthrough = ({ children }) => <>{children}</>;

const Handle = ({ style, ...props }) => (
  <div
    {...props}
    style={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#6b7280",
      position: "absolute",
      ...style,
    }}
  />
);

const Position = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
};

const applyNodeChanges = (changes, nodes) => {
  if (!Array.isArray(changes)) return nodes;
  let next = [...nodes];

  changes.forEach((change) => {
    if (change.type === "remove") {
      next = next.filter((node) => node.id !== change.id);
      return;
    }

    next = next.map((node) => {
      if (node.id !== change.id) return node;
      if (change.type === "position" && change.position) {
        return { ...node, position: change.position };
      }
      if (change.type === "dimensions") {
        return { ...node, dimensions: change.dimensions };
      }
      if (change.type === "select") {
        return { ...node, selected: change.selected };
      }
      return node;
    });
  });

  return next;
};

const applyEdgeChanges = (changes, edges) => {
  if (!Array.isArray(changes)) return edges;
  let next = [...edges];

  changes.forEach((change) => {
    if (change.type === "remove") {
      next = next.filter((edge) => edge.id !== change.id);
      return;
    }

    next = next.map((edge) => {
      if (edge.id !== change.id) return edge;
      if (change.type === "select") {
        return { ...edge, selected: change.selected };
      }
      return edge;
    });
  });

  return next;
};

const addEdge = (connection, edges) => {
  if (!connection?.source || !connection?.target) return edges;
  const id = connection.id || `${connection.source}-${connection.target}`;
  return [...edges, { ...connection, id }];
};

const ReactFlow = ({ children, className = "", style = {}, ...props }) => (
  <div className={className} style={{ position: "relative", ...style }} {...props}>
    {children}
  </div>
);

export const MiniMap = passthrough;
export const Controls = passthrough;
export const Background = passthrough;
export { Handle, Position, addEdge, applyNodeChanges, applyEdgeChanges };
export default ReactFlow;

import React, { useMemo, useState } from 'react';
import { toast } from '../../Components';
import { ButtonNode, ConditionNode, MessageNode, QuestionNode } from './nodes';

const FLOW_STORAGE_KEY = 'chatbot-flow-builder';

const NODE_LIBRARY = [
  { type: 'message', label: 'Message' },
  { type: 'question', label: 'Question' },
  { type: 'button', label: 'Button' },
  { type: 'condition', label: 'Condition' },
];

const NODE_DEFAULTS = {
  message: { label: 'Message', message: 'Hello 👋' },
  question: { label: 'Question', question: 'How can I help you today?', responseKey: 'intent' },
  button: { label: 'Buttons', buttons: ['Order status', 'Talk to support'] },
  condition: {
    label: 'Condition',
    conditions: [{ key: 'intent', operator: 'equals', value: 'Order status' }],
  },
};

const operatorOptions = ['equals', 'not_equals', 'contains', 'starts_with'];

function edgeLabel(sourceNode, targetNode) {
  const sourceLabel = sourceNode?.data?.label || sourceNode?.type || 'Node';
  const targetLabel = targetNode?.data?.label || targetNode?.type || 'Node';

  return `${sourceLabel} → ${targetLabel}`;
}

export default function FlowBuilder() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectFrom, setConnectFrom] = useState('');
  const [connectTo, setConnectTo] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/flow-node', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDropCanvas = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/flow-node');
    if (!type) return;

    const canvasBounds = event.currentTarget.getBoundingClientRect();
    const newNode = {
      id: crypto.randomUUID(),
      type,
      data: { ...NODE_DEFAULTS[type] },
      position: {
        x: Math.round((event.clientX - canvasBounds.left - pan.x) / zoom),
        y: Math.round((event.clientY - canvasBounds.top - pan.y) / zoom),
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const updateSelectedNode = (nextData) => {
    if (!selectedNodeId) return;

    setNodes((prev) =>
      prev.map((node) => (node.id === selectedNodeId ? { ...node, data: { ...node.data, ...nextData } } : node)),
    );
  };

  const addEdge = () => {
    if (!connectFrom || !connectTo || connectFrom === connectTo) {
      toast.error('Pick two different nodes to connect.');
      return;
    }

    const duplicate = edges.some((edge) => edge.source === connectFrom && edge.target === connectTo);
    if (duplicate) {
      toast.error('Connection already exists.');
      return;
    }

    const sourceNode = nodes.find((node) => node.id === connectFrom);
    const targetNode = nodes.find((node) => node.id === connectTo);

    setEdges((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        source: connectFrom,
        target: connectTo,
        label: edgeLabel(sourceNode, targetNode),
      },
    ]);

    setConnectFrom('');
    setConnectTo('');
  };

  const saveFlow = () => {
    const payload = {
      savedAt: new Date().toISOString(),
      isActive,
      nodes,
      edges,
    };

    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(payload));
    toast.success('Flow saved.');
  };

  const loadFlow = () => {
    const raw = window.localStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) {
      toast.error('No saved flow found.');
      return;
    }

    const parsed = JSON.parse(raw);
    setNodes(parsed.nodes || []);
    setEdges(parsed.edges || []);
    setIsActive(Boolean(parsed.isActive));
    setSelectedNodeId((parsed.nodes || [])[0]?.id || null);
    toast.success('Flow loaded.');
  };

  const toggleActivation = () => {
    setIsActive((prev) => !prev);
    toast.success(`Flow ${isActive ? 'deactivated' : 'activated'}.`);
  };

  const removeNode = (nodeId) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const renderNode = (node) => {
    const props = {
      node,
      selected: selectedNodeId === node.id,
      onSelect: () => setSelectedNodeId(node.id),
    };

    if (node.type === 'message') return <MessageNode {...props} />;
    if (node.type === 'question') return <QuestionNode {...props} />;
    if (node.type === 'button') return <ButtonNode {...props} />;

    return <ConditionNode {...props} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Chatbot Flow Builder</h2>
          <p className="text-sm text-gray-500">Drag-and-drop nodes, connect paths, and configure your bot logic.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadFlow}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Load Flow
          </button>
          <button
            type="button"
            onClick={saveFlow}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Flow
          </button>
          <button
            type="button"
            onClick={toggleActivation}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-white ${
              isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr_320px]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Node Library</h3>
          <div className="space-y-2">
            {NODE_LIBRARY.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(event) => onDragStart(event, item.type)}
                className="cursor-grab rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing"
              >
                {item.label}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Zoom / Pan</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700"
              >
                Zoom In
              </button>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700"
              >
                Zoom Out
              </button>
              <button
                type="button"
                onClick={() => setPan({ x: 0, y: 0 })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700"
              >
                Reset Pan
              </button>
            </div>
          </div>
        </aside>

        <section
          className="relative min-h-[540px] overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-sm"
          onDrop={onDropCanvas}
          onDragOver={(event) => event.preventDefault()}
        >
          <div className="absolute left-4 top-4 z-10 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPan((prev) => ({ ...prev, y: prev.y - 20 }))}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setPan((prev) => ({ ...prev, y: prev.y + 20 }))}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setPan((prev) => ({ ...prev, x: prev.x - 20 }))}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setPan((prev) => ({ ...prev, x: prev.x + 20 }))}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                →
              </button>
            </div>
          </div>

          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.15) 1px, transparent 1px)',
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {edges.map((edge) => {
                const source = nodes.find((node) => node.id === edge.source);
                const target = nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;

                const x1 = source.position.x + 240;
                const y1 = source.position.y + 42;
                const x2 = target.position.x;
                const y2 = target.position.y + 42;
                const controlX = (x1 + x2) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${x1} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${x2} ${y2}`}
                      stroke="#64748b"
                      strokeWidth="2"
                      fill="none"
                    />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} fill="#475569" fontSize="11" textAnchor="middle">
                      {edge.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {nodes.map((node) => (
              <div key={node.id} className="absolute" style={{ left: node.position.x, top: node.position.y }}>
                {renderNode(node)}
                <button
                  type="button"
                  onClick={() => removeNode(node.id)}
                  className="mt-1 text-[11px] font-medium text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Node Config</h3>
          {!selectedNode ? (
            <p className="mt-2 text-sm text-gray-500">Select a node on canvas to edit its settings.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Node label
                <input
                  value={selectedNode.data.label || ''}
                  onChange={(event) => updateSelectedNode({ label: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>

              {(selectedNode.type === 'message' || selectedNode.type === 'question') && (
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  {selectedNode.type === 'message' ? 'Message text' : 'Question text'}
                  <textarea
                    value={selectedNode.data.message || selectedNode.data.question || ''}
                    onChange={(event) =>
                      updateSelectedNode(
                        selectedNode.type === 'message'
                          ? { message: event.target.value }
                          : { question: event.target.value },
                      )
                    }
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </label>
              )}

              {selectedNode.type === 'question' && (
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Response key
                  <input
                    value={selectedNode.data.responseKey || ''}
                    onChange={(event) => updateSelectedNode({ responseKey: event.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </label>
              )}

              {selectedNode.type === 'button' && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Buttons</p>
                  {(selectedNode.data.buttons || []).map((button, index) => (
                    <input
                      key={`${button}-${index}`}
                      value={button}
                      onChange={(event) => {
                        const nextButtons = [...(selectedNode.data.buttons || [])];
                        nextButtons[index] = event.target.value;
                        updateSelectedNode({ buttons: nextButtons });
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => updateSelectedNode({ buttons: [...(selectedNode.data.buttons || []), 'New button'] })}
                    className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                  >
                    Add button
                  </button>
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Conditions</p>
                  <div className="mt-2 space-y-2">
                    {(selectedNode.data.conditions || []).map((rule, index) => (
                      <div key={`${rule.key}-${index}`} className="rounded-md border border-gray-200 p-2">
                        <input
                          value={rule.key || ''}
                          onChange={(event) => {
                            const nextRules = [...(selectedNode.data.conditions || [])];
                            nextRules[index] = { ...nextRules[index], key: event.target.value };
                            updateSelectedNode({ conditions: nextRules });
                          }}
                          placeholder="Field"
                          className="mb-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <select
                          value={rule.operator || 'equals'}
                          onChange={(event) => {
                            const nextRules = [...(selectedNode.data.conditions || [])];
                            nextRules[index] = { ...nextRules[index], operator: event.target.value };
                            updateSelectedNode({ conditions: nextRules });
                          }}
                          className="mb-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          {operatorOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          value={rule.value || ''}
                          onChange={(event) => {
                            const nextRules = [...(selectedNode.data.conditions || [])];
                            nextRules[index] = { ...nextRules[index], value: event.target.value };
                            updateSelectedNode({ conditions: nextRules });
                          }}
                          placeholder="Value"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedNode({
                        conditions: [
                          ...(selectedNode.data.conditions || []),
                          { key: '', operator: 'equals', value: '' },
                        ],
                      })
                    }
                    className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                  >
                    Add condition
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Connect nodes</h4>
            <div className="mt-2 space-y-2">
              <select
                value={connectFrom}
                onChange={(event) => setConnectFrom(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">From node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label} ({node.type})
                  </option>
                ))}
              </select>
              <select
                value={connectTo}
                onChange={(event) => setConnectTo(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">To node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label} ({node.type})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addEdge}
                className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Connect Nodes
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

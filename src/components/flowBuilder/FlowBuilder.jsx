import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../Components';
import FlowNodeCard from './nodes/FlowNodeCard';
import { createFlow, deleteFlow, getFlows, updateFlow } from '../../services/flowService';

const NODE_LIBRARY = [
  { type: 'text', label: 'Text Message' },
  { type: 'delay', label: 'Delay' },
  { type: 'condition', label: 'Condition (keyword)' },
  { type: 'end', label: 'End' },
];

const NODE_DEFAULTS = {
  text: { label: 'Text Message', message: 'Hi! Welcome to Sanju Sk Digital 👋', delay: 0, options: [] },
  delay: { label: 'Delay', message: '', delay: 2, options: [] },
  condition: { label: 'Condition', message: '', delay: 0, keyword: '', options: ['yes', 'no'] },
  end: { label: 'End', message: '', delay: 0, options: [] },
};

const normalizeFlows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.flows)) return payload.flows;
  return [];
};

const mapFlowToCanvas = (flow) => ({
  id: flow.id || flow._id,
  name: flow.name || 'Untitled flow',
  triggerKeywords: flow.triggerKeywords || [],
  isActive: Boolean(flow.isActive),
  nodes: (flow.nodes || []).map((node, index) => ({
    id: node.id || crypto.randomUUID(),
    type: node.type || 'text',
    position: node.position || { x: 80 + index * 70, y: 120 + index * 60 },
    data: {
      ...NODE_DEFAULTS[node.type || 'text'],
      ...node.data,
      label: node.data?.label || NODE_DEFAULTS[node.type || 'text']?.label || 'Node',
    },
  })),
  edges: (flow.edges || []).map((edge) => ({
    id: edge.id || crypto.randomUUID(),
    source: edge.source,
    target: edge.target,
  })),
});

const mapCanvasToPayload = ({ flowName, triggerKeywords, nodes, edges, isActive }) => ({
  name: flowName,
  triggerKeywords,
  isActive,
  nodes: nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.data?.label || '',
      message: node.data?.message || '',
      delay: Number(node.data?.delay || 0),
      keyword: node.data?.keyword || '',
      options: Array.isArray(node.data?.options) ? node.data.options : [],
    },
    next: edges.filter((edge) => edge.source === node.id).map((edge) => edge.target),
  })),
  edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
});

export default function FlowBuilder() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [flowName, setFlowName] = useState('');
  const [triggerKeywords, setTriggerKeywords] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reactFlowLib, setReactFlowLib] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [connectFrom, setConnectFrom] = useState('');
  const [connectTo, setConnectTo] = useState('');

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  useEffect(() => {
    const loadReactFlow = async () => {
      try {
        const moduleName = 'reactflow';
        const lib = await import(/* @vite-ignore */ moduleName);
        setReactFlowLib(lib);
      } catch {
        setReactFlowLib(null);
      }
    };

    loadReactFlow();
  }, []);

  const loadFlows = useCallback(async () => {
    try {
      const payload = await getFlows();
      const normalized = normalizeFlows(payload).map(mapFlowToCanvas);
      setFlows(normalized);
    } catch {
      toast.error('Unable to fetch flows from server.');
    }
  }, []);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = event.currentTarget.getBoundingClientRect();

      const position = reactFlowLib && reactFlowInstance?.screenToFlowPosition
        ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
        : {
            x: event.clientX - bounds.left - 80,
            y: event.clientY - bounds.top - 20,
          };

      const newNode = {
        id: crypto.randomUUID(),
        type,
        position,
        data: { ...NODE_DEFAULTS[type] },
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [reactFlowLib, reactFlowInstance],
  );

  const resetBuilder = () => {
    setSelectedFlowId('');
    setFlowName('');
    setTriggerKeywords('');
    setIsActive(true);
    setNodes([]);
    setEdges([]);
    setSelectedNodeId('');
  };

  const loadFlowIntoCanvas = (flowId) => {
    setSelectedFlowId(flowId);
    const found = flows.find((flow) => flow.id === flowId);
    if (!found) return;

    setFlowName(found.name || '');
    setTriggerKeywords((found.triggerKeywords || []).join(', '));
    setIsActive(Boolean(found.isActive));
    setNodes(found.nodes || []);
    setEdges(found.edges || []);
    setSelectedNodeId(found.nodes?.[0]?.id || '');
  };

  const updateNodeData = (patch) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) => (node.id === selectedNodeId ? { ...node, data: { ...node.data, ...patch } } : node)),
    );
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      toast.error('Flow name is required.');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Please add at least one node.');
      return;
    }

    const payload = mapCanvasToPayload({
      flowName: flowName.trim(),
      triggerKeywords: triggerKeywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      isActive,
      nodes,
      edges,
    });

    setIsSaving(true);

    try {
      if (selectedFlowId) {
        await updateFlow(selectedFlowId, payload);
        toast.success('Flow updated successfully.');
      } else {
        await createFlow(payload);
        toast.success('Flow saved successfully.');
      }
      await loadFlows();
    } catch {
      toast.error('Failed to save flow.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFlowId) {
      toast.error('Select a flow to delete.');
      return;
    }

    try {
      await deleteFlow(selectedFlowId);
      toast.success('Flow deleted.');
      resetBuilder();
      await loadFlows();
    } catch {
      toast.error('Failed to delete flow.');
    }
  };

  const addConnectionFallback = () => {
    if (!connectFrom || !connectTo || connectFrom === connectTo) {
      toast.error('Select two different nodes.');
      return;
    }

    const exists = edges.some((edge) => edge.source === connectFrom && edge.target === connectTo);
    if (exists) {
      toast.error('Connection already exists.');
      return;
    }

    setEdges((current) => [...current, { id: crypto.randomUUID(), source: connectFrom, target: connectTo }]);
    setConnectFrom('');
    setConnectTo('');
  };

  const ReactFlowView = reactFlowLib?.default;
  const applyNodeChanges = reactFlowLib?.applyNodeChanges;
  const applyEdgeChanges = reactFlowLib?.applyEdgeChanges;
  const addEdge = reactFlowLib?.addEdge;
  const MiniMap = reactFlowLib?.MiniMap;
  const Controls = reactFlowLib?.Controls;
  const Background = reactFlowLib?.Background;
  const Handle = reactFlowLib?.Handle;
  const Position = reactFlowLib?.Position;

  const nodeTypes = useMemo(() => {
    if (!Handle || !Position) return {};
    return {
      text: (props) => <FlowNodeCard {...props} type="text" HandleComponent={Handle} PositionMap={Position} />,
      delay: (props) => <FlowNodeCard {...props} type="delay" HandleComponent={Handle} PositionMap={Position} />,
      condition: (props) => (
        <FlowNodeCard {...props} type="condition" HandleComponent={Handle} PositionMap={Position} />
      ),
      end: (props) => <FlowNodeCard {...props} type="end" HandleComponent={Handle} PositionMap={Position} />,
    };
  }, [Handle, Position]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">WhatsApp Flow Builder</h2>
            <p className="text-sm text-gray-500">Build drag-and-drop reply journeys with trigger keywords.</p>
            {!reactFlowLib ? (
              <p className="mt-1 text-xs text-amber-600">
                React Flow package unavailable in this environment; using fallback canvas.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/whatsapp-cloud')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Auto Reply
            </button>
            <button
              type="button"
              onClick={resetBuilder}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              New Flow
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Flow'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Existing Flows
            <select
              value={selectedFlowId}
              onChange={(event) => loadFlowIntoCanvas(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            >
              <option value="">Select a flow</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:col-span-2">
            Flow Name
            <input
              value={flowName}
              onChange={(event) => setFlowName(event.target.value)}
              placeholder="Support Flow"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            />
          </label>

          <label className="flex items-end gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Flow Active</span>
          </label>
        </div>

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Trigger Keywords (comma separated)
          <input
            value={triggerKeywords}
            onChange={(event) => setTriggerKeywords(event.target.value)}
            placeholder="hi, hello, support"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr_320px]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Nodes</h3>
          <div className="space-y-2">
            {NODE_LIBRARY.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(event) => onDragStart(event, node.type)}
                className="cursor-grab rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {node.label}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Flow Preview</h4>
            <p className="mt-1 text-xs text-gray-500">{nodes.length} nodes · {edges.length} connections</p>
            <div className="mt-2 max-h-52 space-y-1 overflow-auto pr-1">
              {nodes.map((node, index) => (
                <p key={node.id} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  {index + 1}. {node.data?.label || node.type}
                </p>
              ))}
            </div>
          </div>
        </aside>

        <section
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          className="relative h-[620px] overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-sm"
        >
          {ReactFlowView ? (
            <ReactFlowView
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              onInit={setReactFlowInstance}
              onNodesChange={applyNodeChanges ? (changes) => setNodes((current) => applyNodeChanges(changes, current)) : undefined}
              onEdgesChange={applyEdgeChanges ? (changes) => setEdges((current) => applyEdgeChanges(changes, current)) : undefined}
              onConnect={addEdge ? (params) => setEdges((current) => addEdge(params, current)) : undefined}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            >
              {MiniMap ? <MiniMap /> : null}
              {Controls ? <Controls /> : null}
              {Background ? <Background gap={20} size={1} /> : null}
            </ReactFlowView>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(148,163,184,0.2)_1px,_transparent_1px)] [background-size:20px_20px]" />
              {edges.map((edge) => {
                const source = nodes.find((node) => node.id === edge.source);
                const target = nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;
                const x1 = source.position.x + 224;
                const y1 = source.position.y + 30;
                const x2 = target.position.x;
                const y2 = target.position.y + 30;
                const cx = (x1 + x2) / 2;
                return (
                  <svg key={edge.id} className="pointer-events-none absolute inset-0 h-full w-full">
                    <path d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`} stroke="#64748b" strokeWidth="2" fill="none" />
                  </svg>
                );
              })}
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute"
                  style={{ left: node.position.x, top: node.position.y }}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <FlowNodeCard type={node.type} data={node.data} selected={selectedNodeId === node.id} />
                </div>
              ))}
            </>
          )}
        </section>

        <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Node Properties</h3>
          {!selectedNode ? (
            <p className="mt-2 text-sm text-gray-500">Select a node to edit message, delay, and options.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Label
                <input
                  value={selectedNode.data?.label || ''}
                  onChange={(event) => updateNodeData({ label: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              {(selectedNode.type === 'text' || selectedNode.type === 'condition') && (
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Message
                  <textarea
                    rows={4}
                    value={selectedNode.data?.message || ''}
                    onChange={(event) => updateNodeData({ message: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              )}

              {(selectedNode.type === 'delay' || selectedNode.type === 'text') && (
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Delay (seconds)
                  <input
                    type="number"
                    min="0"
                    value={selectedNode.data?.delay || 0}
                    onChange={(event) => updateNodeData({ delay: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              )}

              {selectedNode.type === 'condition' && (
                <>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Keyword
                    <input
                      value={selectedNode.data?.keyword || ''}
                      onChange={(event) => updateNodeData({ keyword: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Options (comma separated)
                    <input
                      value={(selectedNode.data?.options || []).join(', ')}
                      onChange={(event) =>
                        updateNodeData({
                          options: event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {!ReactFlowView ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Connect Nodes</p>
              <select
                value={connectFrom}
                onChange={(event) => setConnectFrom(event.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">From node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data?.label || node.type}
                  </option>
                ))}
              </select>
              <select
                value={connectTo}
                onChange={(event) => setConnectTo(event.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">To node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data?.label || node.type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addConnectionFallback}
                className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white"
              >
                Connect
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

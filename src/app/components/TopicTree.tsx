import { useState, useEffect } from 'react';
import styles from './TopicTree.module.css';

interface TopicNode {
  id: string;
  name: string;
  children?: TopicNode[];
}

interface TopicTreeProps {
  onSelectTopic: (topicId: string) => void;
}

export default function TopicTree({ onSelectTopic }: TopicTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we're only rendering on the client
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Topic categories - only showing ML for now with complete hierarchy
  const topicData: TopicNode[] = [
    {
      id: "ml",
      name: "Machine Learning",
      children: [
        { 
          id: "ml-foundations", 
          name: "Foundations of Machine Learning",
          children: [
            { id: "ml-core-concepts", name: "Core Concepts" },
            { id: "ml-math-foundations", name: "Mathematical Foundations" },
            { id: "ml-data-preprocessing", name: "Data Preprocessing" }
          ]
        },
        { 
          id: "ml-supervised", 
          name: "Supervised Learning",
          children: [
            { id: "ml-regression", name: "Regression Methods" },
            { id: "ml-classification", name: "Classification Techniques" },
            { id: "ml-decision-trees", name: "Decision Trees and Random Forests" },
            { id: "ml-naive-bayes", name: "Naive Bayes" },
            { id: "ml-ensemble", name: "Ensemble Methods" }
          ]
        },
        { 
          id: "ml-unsupervised", 
          name: "Unsupervised Learning",
          children: [
            { id: "ml-clustering", name: "Clustering" },
            { id: "ml-dimensionality", name: "Dimensionality Reduction" }
          ]
        },
        { 
          id: "ml-neural-networks", 
          name: "Neural Networks",
          children: [
            { id: "ml-nn-fundamentals", name: "Fundamental Concepts" },
            { id: "ml-nn-architectures", name: "Architectures" },
            { id: "ml-cnn", name: "Convolutional Neural Networks" },
            { id: "ml-rnn", name: "Recurrent Neural Networks" },
            { id: "ml-transformers", name: "Transformers" }
          ]
        },
        {
          id: "ml-model-evaluation",
          name: "Model Evaluation",
          children: [
            { id: "ml-validation", name: "Validation Techniques" },
            { id: "ml-metrics", name: "Performance Metrics" }
          ]
        },
        {
          id: "ml-deep-learning",
          name: "Advanced Deep Learning",
          children: [
            { id: "ml-transfer-learning", name: "Transfer Learning" },
            { id: "ml-gans", name: "Generative Adversarial Networks" },
            { id: "ml-reinforcement", name: "Reinforcement Learning" }
          ]
        },
        {
          id: "ml-nlp",
          name: "Natural Language Processing",
          children: [
            { id: "ml-word-embeddings", name: "Word Embeddings" },
            { id: "ml-llm", name: "Large Language Models" }
          ]
        },
        {
          id: "ml-time-series",
          name: "Time Series Analysis"
        },
        {
          id: "ml-practical",
          name: "Practical ML and Deployment"
        }
      ]
    },
    {
      id: "ai",
      name: "Artificial Intelligence"
    },
    {
      id: "webdev",
      name: "Web Development"
    },
    {
      id: "system-design",
      name: "System Design"
    },
    {
      id: "dsa",
      name: "Data Structures & Algorithms"
    }
  ];

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Toggle expanded state
    setExpandedNodes(prev => {
      const newState = { ...prev };
      newState[nodeId] = !prev[nodeId];
      return newState;
    });
    
    // Set as active node
    setActiveNode(nodeId);
    onSelectTopic(nodeId);
  };

  // Function to check if a node should be expanded
  const isExpanded = (nodeId: string) => {
    return !!expandedNodes[nodeId];
  };

  // Recursive function to render a node and its children
  const renderNode = (node: TopicNode, depth: number = 0) => {
    const isActive = activeNode === node.id;
    const expanded = isExpanded(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={`node-${node.id}`} className={styles.node}>
        <div 
          className={`${styles.nodeContent} ${isActive ? styles.active : ''}`}
          onClick={(e) => handleNodeClick(node.id, e)}
        >
          {hasChildren && (
            <span className={`${styles.disclosureIcon} ${expanded ? styles.expanded : ''}`}>
              ▼
            </span>
          )}
          {!hasChildren && <span style={{ width: '1rem', display: 'inline-block' }}></span>}
          {node.name}
        </div>
        
        {hasChildren && expanded && (
          <div className={styles.children}>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return <div className={styles.topicTree}><div style={{ display: 'flex' }}></div></div>;
  }

  return (
    <div className={styles.topicTree}>
      <div>
        {topicData.map((category) => (
          <div key={`branch-${category.id}`} className={styles.branch}>
            {renderNode(category)}
          </div>
        ))}
      </div>
    </div>
  );
} 
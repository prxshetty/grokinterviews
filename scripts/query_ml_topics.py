#!/usr/bin/env python3
"""
ML Topics Parser Script
This script parses ML topics and returns them in a structured JSON format.
"""

import json
import sys
import os

def get_ml_topics():
    """
    Generate a structured representation of ML topics.
    This is a simplified version that returns hardcoded data.
    In a real implementation, this would query a database or parse files.
    """
    # Sample ML topics structure
    ml_topics = {
        "ml": {
            "label": "Machine Learning",
            "subtopics": {
                "supervised-learning": {
                    "id": "supervised-learning",
                    "label": "Supervised Learning",
                    "subtopics": {
                        "linear-regression": {
                            "id": "linear-regression",
                            "label": "Linear Regression",
                            "content": "Linear regression is a linear approach to modeling the relationship between a dependent variable and one or more independent variables."
                        },
                        "logistic-regression": {
                            "id": "logistic-regression",
                            "label": "Logistic Regression",
                            "content": "Logistic regression is a statistical model that uses a logistic function to model a binary dependent variable."
                        },
                        "decision-trees": {
                            "id": "decision-trees",
                            "label": "Decision Trees",
                            "content": "Decision trees are a non-parametric supervised learning method used for classification and regression."
                        },
                        "random-forests": {
                            "id": "random-forests",
                            "label": "Random Forests",
                            "content": "Random forests are an ensemble learning method for classification, regression and other tasks that operates by constructing multiple decision trees."
                        },
                        "support-vector-machines": {
                            "id": "support-vector-machines",
                            "label": "Support Vector Machines",
                            "content": "Support vector machines are supervised learning models with associated learning algorithms that analyze data for classification and regression analysis."
                        }
                    }
                },
                "unsupervised-learning": {
                    "id": "unsupervised-learning",
                    "label": "Unsupervised Learning",
                    "subtopics": {
                        "clustering": {
                            "id": "clustering",
                            "label": "Clustering",
                            "content": "Clustering is the task of grouping a set of objects in such a way that objects in the same group are more similar to each other than to those in other groups."
                        },
                        "dimensionality-reduction": {
                            "id": "dimensionality-reduction",
                            "label": "Dimensionality Reduction",
                            "content": "Dimensionality reduction is the process of reducing the number of random variables under consideration by obtaining a set of principal variables."
                        },
                        "anomaly-detection": {
                            "id": "anomaly-detection",
                            "label": "Anomaly Detection",
                            "content": "Anomaly detection is the identification of rare items, events or observations which raise suspicions by differing significantly from the majority of the data."
                        }
                    }
                },
                "deep-learning": {
                    "id": "deep-learning",
                    "label": "Deep Learning",
                    "subtopics": {
                        "neural-networks": {
                            "id": "neural-networks",
                            "label": "Neural Networks",
                            "content": "Neural networks are a set of algorithms, modeled loosely after the human brain, that are designed to recognize patterns."
                        },
                        "convolutional-neural-networks": {
                            "id": "convolutional-neural-networks",
                            "label": "Convolutional Neural Networks",
                            "content": "Convolutional neural networks are a class of deep neural networks, most commonly applied to analyzing visual imagery."
                        },
                        "recurrent-neural-networks": {
                            "id": "recurrent-neural-networks",
                            "label": "Recurrent Neural Networks",
                            "content": "Recurrent neural networks are a class of artificial neural networks where connections between nodes form a directed graph along a temporal sequence."
                        },
                        "transformers": {
                            "id": "transformers",
                            "label": "Transformers",
                            "content": "Transformers are a type of model architecture that uses self-attention mechanisms to process sequential data."
                        }
                    }
                },
                "reinforcement-learning": {
                    "id": "reinforcement-learning",
                    "label": "Reinforcement Learning",
                    "subtopics": {
                        "q-learning": {
                            "id": "q-learning",
                            "label": "Q-Learning",
                            "content": "Q-learning is a model-free reinforcement learning algorithm to learn the value of an action in a particular state."
                        },
                        "policy-gradients": {
                            "id": "policy-gradients",
                            "label": "Policy Gradients",
                            "content": "Policy gradient methods are a type of reinforcement learning techniques that rely upon optimizing parametrized policies with respect to the expected return."
                        },
                        "deep-q-networks": {
                            "id": "deep-q-networks",
                            "label": "Deep Q-Networks",
                            "content": "Deep Q-Networks (DQN) are a combination of Q-Learning and deep neural networks."
                        }
                    }
                },
                "model-evaluation": {
                    "id": "model-evaluation",
                    "label": "Model Evaluation",
                    "subtopics": {
                        "metrics": {
                            "id": "metrics",
                            "label": "Evaluation Metrics",
                            "content": "Evaluation metrics are used to measure the quality of the statistical or machine learning model."
                        },
                        "cross-validation": {
                            "id": "cross-validation",
                            "label": "Cross-Validation",
                            "content": "Cross-validation is a resampling procedure used to evaluate machine learning models on a limited data sample."
                        },
                        "overfitting-underfitting": {
                            "id": "overfitting-underfitting",
                            "label": "Overfitting & Underfitting",
                            "content": "Overfitting occurs when a model learns the detail and noise in the training data to the extent that it negatively impacts the performance of the model on new data. Underfitting refers to a model that can neither model the training data nor generalize to new data."
                        }
                    }
                }
            }
        }
    }
    
    return ml_topics

if __name__ == "__main__":
    # Get the ML topics
    topics = get_ml_topics()
    
    # Print the JSON output
    print(json.dumps(topics, indent=2))
    
    # Exit successfully
    sys.exit(0)

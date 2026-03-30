import React, { createContext, useState, useContext } from 'react';

const TopicContext = createContext();

export const useTopicContext = () => useContext(TopicContext);

export const TopicProvider = ({ children }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);

  const toggleSelection = (title) => {
    setSelectedTopics((prev) => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const clearSelection = () => setSelectedTopics([]);

  return (
    <TopicContext.Provider value={{ selectedTopics, setSelectedTopics, toggleSelection, clearSelection }}>
      {children}
    </TopicContext.Provider>
  );
};


import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TabViewProps {
  tabs: {
    value: string;
    label: string;
    content: React.ReactNode;
  }[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const TabView: React.FC<TabViewProps> = ({ tabs, defaultValue, onValueChange }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultValue || tabs[0].value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <Tabs defaultValue={defaultValue || tabs[0].value} className="w-full" onValueChange={handleTabChange}>
      <TabsList className="mb-4 w-full md:w-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TabView;

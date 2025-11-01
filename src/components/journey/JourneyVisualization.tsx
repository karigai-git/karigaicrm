import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Eye, 
  Users, 
  ShoppingCart, 
  Heart, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  metrics: {
    customers: number;
    conversionRate: number;
    avgTimeSpent: string;
    value: number;
  };
}

interface JourneyVisualizationProps {
  stages: JourneyStage[];
  selectedStage: string;
  onStageSelect: (stageId: string) => void;
  className?: string;
}

export const JourneyVisualization: React.FC<JourneyVisualizationProps> = ({
  stages,
  selectedStage,
  onStageSelect,
  className
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        {/* Journey Flow */}
        <div className="relative">
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center min-w-0">
                {/* Stage Node */}
                <div
                  className={cn(
                    "relative cursor-pointer transition-all duration-300 hover:scale-105 group",
                    selectedStage === stage.id ? "scale-110" : ""
                  )}
                  onClick={() => onStageSelect(stage.id)}
                >
                  {/* Stage Circle */}
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300",
                    stage.color,
                    selectedStage === stage.id ? "ring-4 ring-blue-200 shadow-xl" : "group-hover:shadow-xl"
                  )}>
                    {stage.icon}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center min-w-max">
                    <div className="text-sm font-medium">{stage.name}</div>
                    <div className="text-xs text-muted-foreground">{stage.metrics.customers} customers</div>
                  </div>
                  
                  {/* Conversion Rate Badge */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <Badge 
                      variant={stage.metrics.conversionRate > 50 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {stage.metrics.conversionRate}% conversion
                    </Badge>
                  </div>
                </div>
                
                {/* Arrow between stages */}
                {index < stages.length - 1 && (
                  <div className="flex items-center mx-6 min-w-0">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 relative min-w-[60px]">
                      <ArrowRight className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Conversion indicator */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        {stages[index + 1].metrics.conversionRate > stages[index].metrics.conversionRate ? (
                          <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span>
                          {Math.abs(stages[index + 1].metrics.conversionRate - stages[index].metrics.conversionRate).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Selected Stage Details */}
          {selectedStage && (
            <div className="mt-16 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stages
                  .filter(stage => stage.id === selectedStage)
                  .map(stage => (
                    <React.Fragment key={stage.id}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stage.metrics.customers}</div>
                        <div className="text-sm text-muted-foreground">Total Customers</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stage.metrics.conversionRate}%</div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stage.metrics.avgTimeSpent}</div>
                        <div className="text-sm text-muted-foreground">Avg. Time Spent</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ₹{stage.metrics.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                      </div>
                    </React.Fragment>
                  ))}
              </div>
              
              {/* Stage Description */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {stages.find(s => s.id === selectedStage)?.name} Stage
                </h3>
                <p className="text-muted-foreground">
                  {stages.find(s => s.id === selectedStage)?.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
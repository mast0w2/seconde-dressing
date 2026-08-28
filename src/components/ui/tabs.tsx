import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(
      value || defaultValue || ""
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setActiveTab(value);
      }
    }, [value]);

    const handleTabChange = (newValue: string) => {
      setActiveTab(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        <div className="flex gap-2 border-b">
          {React.Children.map(props.children, (child) => {
            if (React.isValidElement(child) && child.type === TabsList) {
              return React.cloneElement(child, {
                activeTab,
                onTabChange: handleTabChange,
              });
            }
            return child;
          })}
        </div>
        <div>
          {React.Children.map(props.children, (child) => {
            if (React.isValidElement(child) && child.type === TabsContent) {
              return React.cloneElement(child, {
                isActive: activeTab === child.props.value,
              });
            }
            return child;
          })}
        </div>
      </div>
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, activeTab, onTabChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex gap-2", className)}
        {...props}
      >
        {React.Children.map(props.children, (child) => {
          if (React.isValidElement(child) && child.type === TabsTrigger) {
            return React.cloneElement(child, {
              isActive: activeTab === child.props.value,
              onClick: () => onTabChange?.(child.props.value),
            });
          }
          return child;
        })}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  isActive?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, isActive, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          isActive && "bg-background text-foreground shadow-sm",
          className
        )}
        data-state={isActive ? "active" : "inactive"}
        onClick={onClick}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  isActive?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, isActive, ...props }, ref) => {
    if (!isActive) return null;

    return (
      <div
        ref={ref}
        className={cn("ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

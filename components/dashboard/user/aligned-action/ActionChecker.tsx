"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import CompletionDialog from "./CompletionDialog";

// Time interval for checking pending actions (every minute)
const CHECK_INTERVAL = 60 * 1000;
// Add a debounce time to prevent excessive API calls
const DEBOUNCE_TIME = 10 * 1000; // 10 seconds

interface AlignedAction {
  id: string;
  mood: string;
  notes: string[];
  summaryType: string;
  taskTypes: string[];
  scheduledTime: string;
  secondaryTime?: string;
  selectedOption?: string;
  completed: boolean;
  createdAt: string;
}

export default function ActionChecker() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<AlignedAction | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // const [_, setAddressedActionIds] = useState<Set<string>>(new Set());
  const [hasCompletedActionToday, setHasCompletedActionToday] = useState(false);
  const [globalModalActive, setGlobalModalActive] = useState(false);
  
  // Add refs to track last check time and result
  const lastCheckTimeRef = useRef<number>(0);
  const lastCheckResultRef = useRef<boolean>(false);

  // Check if there's already a completed action today
  const checkCompletedActionToday = async () => {
    try {
      // Check if we've made this request recently (within debounce time)
      const now = Date.now();
      if (now - lastCheckTimeRef.current < DEBOUNCE_TIME) {
        // Return the cached result instead of making a new API call
        setHasCompletedActionToday(lastCheckResultRef.current);
        return lastCheckResultRef.current;
      }
      
      // Make the API call if enough time has passed
      const response = await axios.get("/api/aligned-action/completed-today");
      const hasCompletedToday = response.data.hasCompletedToday;
      
      // Store the result and timestamp
      lastCheckTimeRef.current = now;
      lastCheckResultRef.current = hasCompletedToday;
      
      setHasCompletedActionToday(hasCompletedToday);
      return hasCompletedToday;
    } catch (error) {
      console.error("Error checking completed actions:", error);
      return false;
    }
  };

  // Add an action ID to the list of addressed actions in localStorage
  const addAddressedActionId = useCallback((actionId: string) => {
    try {
      const addressedActions = localStorage.getItem('addressedActionIds');
      let updatedActions: string[] = [];
      
      if (addressedActions) {
        updatedActions = JSON.parse(addressedActions);
      }
      
      if (!updatedActions.includes(actionId)) {
        updatedActions.push(actionId);
        localStorage.setItem('addressedActionIds', JSON.stringify(updatedActions));
        
        // Update state
        // setAddressedActionIds(prev => {
        //   const newSet = new Set(prev);
        //   newSet.add(actionId);
        //   return newSet;
        // });
      }
    } catch (error) {
      console.error('Error updating addressed actions in localStorage:', error);
    }
  }, []);

  // Check for pending actions
  const checkPendingActions = useCallback(async () => {
    if (isChecking || isDialogOpen || globalModalActive) return;
    
    setIsChecking(true);
    
    try {
      // First check if the user has already completed an action today
      const completedToday = await checkCompletedActionToday();
      
      if (completedToday) {
        setHasCompletedActionToday(true);
        setIsChecking(false);
        return;
      }
      
      const response = await axios.get<{ actions: AlignedAction[] }>("/api/aligned-action/pending");
      const actions = response.data.actions;
      
      if (!actions || actions.length === 0) {
        setIsChecking(false);
        return;
      }
      
      // Get addressed action IDs from localStorage
      let addressedIds: string[] = [];
      try {
        const storedIds = localStorage.getItem('addressedActionIds');
        if (storedIds) {
          addressedIds = JSON.parse(storedIds);
        }
      } catch (error) {
        console.error('Error parsing addressed actions:', error);
      }
      
      // Filter out actions that have already been addressed
      const unaddressedActions = actions.filter(action => !addressedIds.includes(action.id));
      
      if (unaddressedActions.length === 0) {
        setIsChecking(false);
        return;
      }
      
      // Get the earliest scheduled action
      const earliestAction = unaddressedActions.sort(
        (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      )[0];
      
      // Check if the action is due
      const scheduledTime = new Date(earliestAction.scheduledTime);
      const now = new Date();
      
      if (scheduledTime <= now && !earliestAction.completed) {
        // Check if any component is already handling this action
        const step4ActionId = localStorage.getItem('step4HandlingActionId');
        const globalModalActionId = localStorage.getItem('globalModalActionId');
        
        if (step4ActionId === earliestAction.id || globalModalActionId === earliestAction.id) {
          setIsChecking(false);
          return;
        }
        
        // Check if the action was already addressed
        if (addressedIds.includes(earliestAction.id)) {
          setIsChecking(false);
          return;
        }
        
        // Check if the action was created today
        const actionDate = new Date(earliestAction.createdAt);
        const today = new Date();
        const isActionFromToday = 
          actionDate.getFullYear() === today.getFullYear() &&
          actionDate.getMonth() === today.getMonth() &&
          actionDate.getDate() === today.getDate();
        
        if (isActionFromToday) {
          // Set flags to show modal
          localStorage.setItem('globalModalActionId', earliestAction.id);
          localStorage.setItem('actionCheckerHandlingActionId', earliestAction.id);
          setGlobalModalActive(true);
          setCurrentAction(earliestAction);
          setIsDialogOpen(true);
        } else {
          // Mark action from another day as addressed without showing dialog
          addAddressedActionId(earliestAction.id);
        }
      }
    } catch (error) {
      console.error("Error checking pending actions:", error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isDialogOpen, globalModalActive, addAddressedActionId, checkCompletedActionToday]);

  // Initialize and set up checking interval
  useEffect(() => {
    // Load addressed action IDs from localStorage on mount
    try {
      const storedIds = localStorage.getItem('addressedActionIds');
      if (storedIds) {
        const parsedIds = JSON.parse(storedIds);
        if (Array.isArray(parsedIds)) {
          // setAddressedActionIds(new Set(parsedIds));
        }
      }
    } catch (error) {
      console.error('Error loading addressed action IDs from localStorage:', error);
    }
    
    // Initial check when component mounts
    checkCompletedActionToday();
    checkPendingActions();
    
    // Set up interval for periodic checks, but with a longer interval (every minute instead of continuously)
    const intervalId = setInterval(() => {
      checkPendingActions().catch(error => {
        console.error("Error in scheduled check:", error);
      });
    }, CHECK_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [checkPendingActions]);

  // Monitor global modal status
  useEffect(() => {
    const checkGlobalModal = () => {
      const globalModalActionId = localStorage.getItem('globalModalActionId');
      setGlobalModalActive(!!globalModalActionId);
    };
    
    checkGlobalModal();
    const intervalId = setInterval(checkGlobalModal, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle dialog close
  const handleCloseDialog = (actionId: string, wasCompleted: boolean) => {
    if (wasCompleted) {
      setHasCompletedActionToday(true);
    }
    
    addAddressedActionId(actionId);
    
    localStorage.removeItem('actionCheckerHandlingActionId');
    localStorage.removeItem('globalModalActionId');
    setGlobalModalActive(false);
    
    setIsDialogOpen(false);
    setCurrentAction(null);
    
    setTimeout(() => {
      checkPendingActions();
    }, 1000);
  };

  return (
    <>
      {currentAction && !hasCompletedActionToday && (
        <CompletionDialog
          isOpen={isDialogOpen}
          onClose={(wasCompleted: boolean) => handleCloseDialog(currentAction.id, wasCompleted)}
          actionData={currentAction}
        />
      )}
    </>
  );
} 
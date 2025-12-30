'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * and displays a fallback UI instead of crashing
 */

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    showRetry?: boolean;
    componentName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-red-800 dark:text-red-200">
                                {this.props.componentName ? `${this.props.componentName} Error` : 'Something went wrong'}
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                {this.state.error?.message || 'An unexpected error occurred'}
                            </p>
                            {this.props.showRetry !== false && (
                                <button
                                    onClick={this.handleRetry}
                                    className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Wrapper for async data loading with error handling
 */
interface DataLoaderProps<T> {
    data: T | null | undefined;
    loading: boolean;
    error: string | null;
    skeleton: ReactNode;
    children: (data: T) => ReactNode;
    onRetry?: () => void;
    emptyMessage?: string;
}

export function DataLoader<T>({
    data,
    loading,
    error,
    skeleton,
    children,
    onRetry,
    emptyMessage = 'No data available',
}: DataLoaderProps<T>) {
    if (loading) {
        return <>{skeleton}</>;
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-2 flex items-center gap-1 text-sm text-red-700 dark:text-red-300 hover:underline"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Try again
                    </button>
                )}
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return <>{children(data)}</>;
}

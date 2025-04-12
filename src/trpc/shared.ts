import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";
import superjson from "superjson";

// Export transformer for consistent use across client and server
// Make sure to call superjson() to get an instance, not just the module
export const transformer = superjson;

// Debug the transformer behavior
// Log information about transformations for debugging
(() => {
  const originalParse = superjson.parse;
  const originalStringify = superjson.stringify;
  
  superjson.parse = function(json: string) {
    try {
      console.log('[SuperJSON] Parsing JSON (first 100 chars):', 
        json.length > 100 ? json.substring(0, 100) + '...' : json);
      
      // Try to log the structure being parsed
      try {
        const parsed = JSON.parse(json);
        console.log('[SuperJSON] Parsed structure keys:', Object.keys(parsed));
        
        // Special debug for array results
        if (parsed && parsed.json && Array.isArray(parsed.json)) {
          console.log('[SuperJSON] JSON contains array with', parsed.json.length, 'items');
          
          // Check the first item if it exists
          if (parsed.json.length > 0) {
            console.log('[SuperJSON] First item keys:', Object.keys(parsed.json[0]));
          }
        }
      } catch (e) {
        console.error('[SuperJSON] Error analyzing JSON structure:', e);
      }
      
      const result = originalParse.call(this, json);
      
      // Log what we got back
      if (result) {
        console.log('[SuperJSON] After parse - Type:', 
          Array.isArray(result) ? 'Array[' + result.length + ']' : typeof result);
        
        if (typeof result === 'object' && result !== null) {
          console.log('[SuperJSON] After parse - Keys:', Object.keys(result));
        }
      }
      
      return result;
    } catch (e) {
      console.error('[SuperJSON] Error in parse:', e);
      console.error('[SuperJSON] JSON that caused error:', json);
      throw e;
    }
  };
  
  superjson.stringify = function(obj) {
    try {
      console.log('[SuperJSON] Stringifying object of type:', 
        Array.isArray(obj) ? 'Array[' + obj.length + ']' : typeof obj);
      
      if (typeof obj === 'object' && obj !== null) {
        console.log('[SuperJSON] Object keys:', Object.keys(obj));
        
        // Special debug for array data
        if (Array.isArray(obj) && obj.length > 0) {
          console.log('[SuperJSON] First item type:', typeof obj[0]);
          if (typeof obj[0] === 'object' && obj[0] !== null) {
            console.log('[SuperJSON] First item keys:', Object.keys(obj[0]));
          }
        }
      }
      
      const result = originalStringify.call(this, obj);
      
      console.log('[SuperJSON] Stringify result (first 100 chars):', 
        result.length > 100 ? result.substring(0, 100) + '...' : result);
      
      return result;
    } catch (e) {
      console.error('[SuperJSON] Error in stringify:', e);
      console.error('[SuperJSON] Object that caused error:', obj);
      throw e;
    }
  };
})();

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    // browser should use relative path
    return "";
  }
  
  if (process.env.VERCEL_URL) {
    // SSR should use vercel url
    return `https://${process.env.VERCEL_URL}`;
  }

  // dev SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl() {
  return `${getBaseUrl()}/api/trpc`;
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
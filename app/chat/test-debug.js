// Simple test script to debug tRPC/SuperJSON issues
// This will be imported into the page component

export function runDiagnostics() {
  console.log('🔍 RUNNING DIAGNOSTICS SCRIPT');
  
  // Add visual marker to confirm script is running
  try {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.right = '10px';
    div.style.backgroundColor = 'blue';
    div.style.color = 'white';
    div.style.padding = '10px';
    div.style.zIndex = '10000';
    div.textContent = 'DIAGNOSTICS RUNNING';
    document.body.appendChild(div);
  } catch (e) {
    console.error('Unable to add debug element:', e);
  }
  
  // Basic test of object iteration
  try {
    console.log('Testing basic iteration:');
    
    // Test 1: Create and iterate an array 
    const testArray = [1, 2, 3];
    console.log('Array iteration working:', [...testArray]);
    
    // Test 2: Create and iterate an object
    const testObj = { a: 1, b: 2 };
    console.log('Object keys iteration working:', Object.keys(testObj));
    
    // Test 3: Test that JSON functions work
    const jsonString = JSON.stringify(testObj);
    const parsedJson = JSON.parse(jsonString);
    console.log('JSON functions working:', parsedJson);
    
    // Test 4: Check for Symbol.iterator
    console.log('Array has Symbol.iterator:', Symbol.iterator in testArray);
    console.log('Object has Symbol.iterator:', Symbol.iterator in testObj);
    
    // Test environment
    console.log('Environment check:');
    console.log('- Window object:', typeof window);
    console.log('- Document object:', typeof document);
    console.log('- navigator:', typeof navigator, navigator?.userAgent);
    console.log('- location:', window.location.href);
  } catch (e) {
    console.error('Diagnostic tests failed:', e);
  }
  
  // Make a test API call that doesn't use tRPC
  try {
    console.log('Making direct fetch request to test network:');
    fetch('/api/trpc/healthcheck', { method: 'GET' })
      .then(response => {
        console.log('API response status:', response.status);
        return response.text();
      })
      .then(text => {
        console.log('API response text:', text.substring(0, 100));
      })
      .catch(error => {
        console.error('API fetch error:', error);
      });
  } catch (e) {
    console.error('Fetch test failed:', e);
  }
  
  return true;
}

export function mockSuperJSON() {
  // Create a minimal SuperJSON-like transformer for testing
  const transformer = {
    stringify: function(obj) {
      console.log('Mock SuperJSON stringify called with:', obj);
      
      // Just regular JSON stringify with a wrapper
      const result = JSON.stringify({
        json: obj,
        meta: { values: {}, referentialEqualities: [] }
      });
      
      console.log('Stringify result:', result);
      return result;
    },
    
    parse: function(str) {
      console.log('Mock SuperJSON parse called with:', str);
      
      try {
        // Parse and extract the json field
        const parsed = JSON.parse(str);
        console.log('Parsed structure:', parsed);
        
        if (parsed && parsed.json) {
          return parsed.json;
        }
        return parsed;
      } catch (e) {
        console.error('Mock parse error:', e);
        throw e; 
      }
    },
    
    createProxy: function(obj) {
      console.log('Mock createProxy called with:', obj);
      return obj;
    }
  };
  
  return transformer;
}

// Create a mock tRPC client for testing
export function createMockClient() {
  return {
    chat: {
      getSessions: {
        useQuery: (params) => {
          console.log('Mock getSessions.useQuery called with:', params);
          
          // Return mock data
          return {
            data: [
              { 
                id: 'mock-session-1', 
                title: 'Mock Chat 1', 
                created_at: new Date().toISOString(), 
                updated_at: new Date().toISOString(),
                user_id: 'mock-user-id',
                position: 0,
                is_pinned: false,
                status: 'active'
              },
              { 
                id: 'mock-session-2', 
                title: 'Mock Chat 2',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                updated_at: new Date(Date.now() - 86400000).toISOString(),
                user_id: 'mock-user-id',
                position: 1,
                is_pinned: true,
                status: 'active'
              }
            ],
            isLoading: false,
            refetch: () => console.log('Mock refetch called'),
            error: null
          };
        }
      },
      createSession: {
        useMutation: (options) => {
          console.log('Mock createSession.useMutation initialized with:', options);
          
          return {
            mutate: (data, callbacks) => {
              console.log('Mock createSession.mutate called with:', data);
              
              // Simulate a success after 500ms
              setTimeout(() => {
                const result = {
                  id: 'mock-' + Math.random().toString(36).substring(2, 9),
                  title: data.title,
                  user_id: 'mock-user-id',
                  is_pinned: data.is_pinned,
                  position: 0,
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                if (callbacks?.onSuccess) {
                  callbacks.onSuccess(result);
                }
                
                if (callbacks?.onSettled) {
                  callbacks.onSettled();
                }
              }, 500);
            },
            isLoading: false
          };
        }
      }
    }
  };
}
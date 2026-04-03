const Module = require("node:module");

function loadModuleWithMocks(modulePath, mocks = {}) {
  const resolvedModulePath = require.resolve(modulePath);
  const originalLoad = Module._load;

  delete require.cache[resolvedModulePath];

  Module._load = function patchedLoad(request, parent, isMain) {
    const resolvedRequest = Module._resolveFilename(request, parent, isMain);

    if (Object.prototype.hasOwnProperty.call(mocks, resolvedRequest)) {
      return mocks[resolvedRequest];
    }

    return originalLoad.apply(this, arguments);
  };

  try {
    return require(resolvedModulePath);
  } finally {
    Module._load = originalLoad;
  }
}

module.exports = { loadModuleWithMocks };

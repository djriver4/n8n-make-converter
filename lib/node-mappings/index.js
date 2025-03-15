"use strict";
/**
 * Node Mappings Index
 *
 * Exports all components of the node mapping system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./schema"), exports);
__exportStar(require("./node-mapping-loader"), exports);
__exportStar(require("./node-mapper"), exports);
__exportStar(require("./node-types"), exports);
// Re-export the NodeMapper as the default export
const node_mapper_1 = require("./node-mapper");
exports.default = node_mapper_1.NodeMapper;

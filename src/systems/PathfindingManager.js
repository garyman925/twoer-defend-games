/**
 * 尋路管理器
 * 實現A*算法和地圖網格系統，讓敵人能夠智能尋路
 */

import GameConfig from '../core/GameConfig.js';

export class PathfindingManager {
  constructor(scene) {
    this.scene = scene;
    
    // 網格設置 (匹配 Tiled 地圖)
    this.gridSize = GameConfig.TOWER.PLACEMENT_GRID_SIZE || 32; // 與塔放置格子統一
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.grid = [];
    
    // 地圖障礙物
    this.obstacles = [];
    this.towers = [];
    
    this.init();
    
  }

  /**
   * 初始化尋路系統
   */
  init() {
    // 使用遊戲視窗尺寸而不是地圖尺寸
    const { width, height } = this.scene.scale.gameSize;
    
    this.gridWidth = Math.ceil(width / this.gridSize);
    this.gridHeight = Math.ceil(height / this.gridSize);
    
    // 創建空白網格
    this.createGrid();
    
  }

  /**
   * 創建網格
   */
  createGrid() {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = {
          x: x,
          y: y,
          walkable: true,
          worldX: x * this.gridSize + this.gridSize / 2,
          worldY: y * this.gridSize + this.gridSize / 2,
          // A*算法用
          g: 0, // 從起點到當前點的成本
          h: 0, // 從當前點到終點的估計成本
          f: 0, // g + h
          parent: null
        };
      }
    }
  }

  /**
   * 世界坐標轉網格坐標
   */
  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize)
    };
  }

  /**
   * 網格坐標轉世界坐標
   */
  gridToWorld(gridX, gridY) {
    return {
      x: gridX * this.gridSize + this.gridSize / 2,
      y: gridY * this.gridSize + this.gridSize / 2
    };
  }

  /**
   * 檢查網格點是否有效
   */
  isValidGrid(x, y) {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
  }

  /**
   * 獲取網格節點
   */
  getNode(x, y) {
    if (!this.isValidGrid(x, y)) return null;
    return this.grid[y][x];
  }

  /**
   * 更新障礙物地圖
   */
  updateObstacles() {
    // 重置所有網格為可通行
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].walkable = true;
      }
    }

    // 標記塔為障礙物
    if (this.scene.towers) {
      this.scene.towers.children.entries.forEach(tower => {
        const gridPos = this.worldToGrid(tower.x, tower.y);
        
        // 將塔周圍的區域標記為不可通行
        const radius = 2; // 塔的影響半徑（網格單位）
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const gx = gridPos.x + dx;
            const gy = gridPos.y + dy;
            
            if (this.isValidGrid(gx, gy)) {
              // 根據距離計算阻擋程度
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance <= radius) {
                this.grid[gy][gx].walkable = false;
              }
            }
          }
        }
      });
    }

    // 標記邊界為障礙物
    this.markBoundaries();
  }

  /**
   * 標記邊界為障礙物
   */
  markBoundaries() {
    const borderSize = 1; // 邊界厚度
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (x < borderSize || x >= this.gridWidth - borderSize ||
            y < borderSize || y >= this.gridHeight - borderSize) {
          this.grid[y][x].walkable = false;
        }
      }
    }
  }

  /**
   * A*尋路算法
   */
  findPath(startX, startY, endX, endY) {
    // 更新障礙物地圖
    this.updateObstacles();
    
    // 轉換為網格坐標
    const startGrid = this.worldToGrid(startX, startY);
    const endGrid = this.worldToGrid(endX, endY);
    
    // 檢查起點和終點是否有效
    if (!this.isValidGrid(startGrid.x, startGrid.y) || 
        !this.isValidGrid(endGrid.x, endGrid.y)) {
      console.warn('起點或終點超出地圖範圍，使用直線路徑');
      return this.getDirectPath(startX, startY, endX, endY);
    }

    // 重置所有節點
    this.resetNodes();
    
    const startNode = this.getNode(startGrid.x, startGrid.y);
    let endNode = this.getNode(endGrid.x, endGrid.y);
    
    if (!startNode || !endNode) {
      return this.getDirectPath(startX, startY, endX, endY);
    }

    // 如果終點不可通行，尋找最近的可通行點
    if (!endNode.walkable) {
      const nearestWalkable = this.findNearestWalkable(endGrid.x, endGrid.y);
      if (nearestWalkable) {
        endNode = nearestWalkable;
      } else {
        return this.getDirectPath(startX, startY, endX, endY);
      }
    }

    const openList = [];
    const closedList = [];

    // 初始化起點
    startNode.g = 0;
    startNode.h = this.heuristic(startNode, endNode);
    startNode.f = startNode.g + startNode.h;
    
    openList.push(startNode);

    while (openList.length > 0) {
      // 找到f值最小的節點
      let currentNode = openList[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
          currentIndex = i;
        }
      }

      // 從開放列表移除，加入關閉列表
      openList.splice(currentIndex, 1);
      closedList.push(currentNode);

      // 找到終點
      if (currentNode === endNode) {
        return this.reconstructPath(currentNode, startX, startY);
      }

      // 檢查鄰居節點
      const neighbors = this.getNeighbors(currentNode);
      
      for (const neighbor of neighbors) {
        // 跳過不可通行或已在關閉列表的節點
        if (!neighbor.walkable || closedList.includes(neighbor)) {
          continue;
        }

        // 計算到鄰居的成本
        const tentativeG = currentNode.g + this.getMoveCost(currentNode, neighbor);

        // 如果鄰居不在開放列表中，或找到更短路徑
        if (!openList.includes(neighbor)) {
          openList.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue; // 這不是更好的路徑
        }

        // 更新鄰居節點
        neighbor.parent = currentNode;
        neighbor.g = tentativeG;
        neighbor.h = this.heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    // 沒找到路徑，返回直線路徑
    console.warn('A*算法未找到路徑，使用直線路徑');
    return this.getDirectPath(startX, startY, endX, endY);
  }

  /**
   * 獲取鄰居節點
   */
  getNeighbors(node) {
    const neighbors = [];
    
    // 8方向移動
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const newX = node.x + dx;
      const newY = node.y + dy;
      
      const neighbor = this.getNode(newX, newY);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * 啟發式函數（曼哈頓距離）
   */
  heuristic(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
  }

  /**
   * 獲取移動成本
   */
  getMoveCost(fromNode, toNode) {
    const dx = Math.abs(fromNode.x - toNode.x);
    const dy = Math.abs(fromNode.y - toNode.y);
    
    // 對角線移動成本更高
    if (dx === 1 && dy === 1) {
      return 14; // 對角線 (√2 ≈ 1.414 * 10)
    } else {
      return 10; // 直線移動
    }
  }

  /**
   * 重構路徑
   */
  reconstructPath(endNode, startX, startY) {
    const path = [];
    let currentNode = endNode;

    // 從終點回溯到起點
    while (currentNode) {
      const worldPos = this.gridToWorld(currentNode.x, currentNode.y);
      path.unshift({
        x: worldPos.x,
        y: worldPos.y,
        gridX: currentNode.x,
        gridY: currentNode.y
      });
      currentNode = currentNode.parent;
    }

    // 確保起點是準確的世界坐標
    if (path.length > 0) {
      path[0].x = startX;
      path[0].y = startY;
    }

    console.log(`A*尋路完成，路徑長度: ${path.length}`);
    return path;
  }

  /**
   * 重置所有節點
   */
  resetNodes() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const node = this.grid[y][x];
        node.g = 0;
        node.h = 0;
        node.f = 0;
        node.parent = null;
      }
    }
  }

  /**
   * 尋找最近的可通行點
   */
  findNearestWalkable(gridX, gridY) {
    const maxRadius = 10;
    
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const newX = gridX + dx;
            const newY = gridY + dy;
            
            const node = this.getNode(newX, newY);
            if (node && node.walkable) {
              return node;
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * 獲取直線路徑（備用）
   */
  getDirectPath(startX, startY, endX, endY) {
    return [
      { x: startX, y: startY },
      { x: endX, y: endY }
    ];
  }

  /**
   * 簡化路徑（移除不必要的轉折點）
   */
  smoothPath(path) {
    if (path.length <= 2) return path;

    const smoothed = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = smoothed[smoothed.length - 1];
      const current = path[i];
      const next = path[i + 1];
      
      // 檢查是否可以直接從prev到next
      if (!this.hasLineOfSight(prev.x, prev.y, next.x, next.y)) {
        smoothed.push(current);
      }
    }
    
    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  /**
   * 檢查兩點間是否有視線（無障礙物）
   */
  hasLineOfSight(x1, y1, x2, y2) {
    const grid1 = this.worldToGrid(x1, y1);
    const grid2 = this.worldToGrid(x2, y2);
    
    // 檢查網格坐標是否有效
    if (!this.isValidGrid(grid1.x, grid1.y) || !this.isValidGrid(grid2.x, grid2.y)) {
      console.warn('視線檢查：網格坐標超出範圍', { grid1, grid2 });
      return false;
    }
    
    const dx = Math.abs(grid2.x - grid1.x);
    const dy = Math.abs(grid2.y - grid1.y);
    const stepX = grid1.x < grid2.x ? 1 : -1;
    const stepY = grid1.y < grid2.y ? 1 : -1;
    
    let err = dx - dy;
    let x = grid1.x;
    let y = grid1.y;
    
    while (true) {
      const node = this.getNode(x, y);
      if (!node || !node.walkable) {
        return false;
      }
      
      if (x === grid2.x && y === grid2.y) {
        break;
      }
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += stepX;
      }
      if (e2 < dx) {
        err += dx;
        y += stepY;
      }
    }
    
    return true;
  }

  /**
   * 獲取從起點到終點的完整路徑
   */
  getPath(startX, startY, endX, endY, useSmoothing = true) {
    // 如果場景有 Tiled 地圖路徑，優先使用
    if (this.scene.gamePath && this.scene.gamePath.length > 0) {
      console.log('使用 Tiled 地圖路徑');
      return this.scene.gamePath;
    }
    
    // 否則使用 A* 算法
    const rawPath = this.findPath(startX, startY, endX, endY);
    
    // 確保路徑有效
    if (!rawPath || !Array.isArray(rawPath) || rawPath.length === 0) {
      console.warn('尋路失敗，返回直線路徑', { startX, startY, endX, endY });
      return this.getDirectPath(startX, startY, endX, endY);
    }
    
    if (useSmoothing && rawPath.length > 2) {
      const smoothedPath = this.smoothPath(rawPath);
      // 確保平滑後的路徑仍然有效
      if (!smoothedPath || !Array.isArray(smoothedPath) || smoothedPath.length === 0) {
        console.warn('路徑平滑化失敗，使用原始路徑', rawPath);
        return rawPath;
      }
      return smoothedPath;
    }
    
    return rawPath;
  }

  /**
   * 調試：繪制網格和路徑
   */
  debugDrawGrid() {
    if (!this.scene.physics.world.debugGraphic) return;
    
    const graphics = this.scene.add.graphics();
    graphics.setDepth(-1);
    
    // 繪制網格
    graphics.lineStyle(1, 0x333333, 0.3);
    for (let x = 0; x <= this.gridWidth; x++) {
      graphics.lineBetween(x * this.gridSize, 0, x * this.gridSize, this.gridHeight * this.gridSize);
    }
    for (let y = 0; y <= this.gridHeight; y++) {
      graphics.lineBetween(0, y * this.gridSize, this.gridWidth * this.gridSize, y * this.gridSize);
    }
    
    // 繪制障礙物
    graphics.fillStyle(0xff0000, 0.3);
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (!this.grid[y][x].walkable) {
          graphics.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
        }
      }
    }
  }

  /**
   * 銷毀尋路管理器
   */
  destroy() {
    this.grid = null;
    this.obstacles = null;
    this.towers = null;
    
    console.log('尋路管理器已銷毀');
  }
}

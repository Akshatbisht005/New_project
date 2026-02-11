/**
 * CONFIDENTIAL - Property of Zetheta Algorithms Private Limited
 * Implementation of Core Matching Engine Logic
 */

interface Order {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price: number;
  quantity: number;
  filled: number;
}

interface Trade {
  buyerId: number;
  sellerId: number;
  price: number;
  quantity: number;
  timestamp: number;
}

class OrderMatchingEngine {
  private buyOrders: Order[] = []; [span_5](start_span)[span_6](start_span)// Sorted highest price first[span_5](end_span)[span_6](end_span)
  private sellOrders: Order[] = []; [span_7](start_span)[span_8](start_span)// Sorted lowest price first[span_7](end_span)[span_8](end_span)
  public executedTrades: Trade[] = []; [span_9](start_span)// Audit trail[span_9](end_span)

  public submitOrder(order: Order) {
    [span_10](start_span)// 1. Validate the order incoming[span_10](end_span)
    [span_11](start_span)if (order.quantity <= 0) throw new Error('Invalid order quantity');[span_11](end_span)

    [span_12](start_span)// 2. Immediate execution for MARKET orders[span_12](end_span)
    if (order.type === 'MARKET') {
      [span_13](start_span)return this.executeMarketOrder(order);[span_13](end_span)
    }

    [span_14](start_span)// 3. Add LIMIT orders to the book and sort[span_14](end_span)
    if (order.side === 'BUY') {
      [span_15](start_span)this.buyOrders.push(order);[span_15](end_span)
      this.buyOrders.sort((a, b) => b.price - a.price); [span_16](start_span)// Price priority[span_16](end_span)
    } else {
      [span_17](start_span)this.sellOrders.push(order);[span_17](end_span)
      this.sellOrders.sort((a, b) => a.price - b.price); [span_18](start_span)// Price priority[span_18](end_span)
    }

    [span_19](start_span)// 4. Trigger matching logic for the new limit order[span_19](end_span)
    this.matchOrders();

    return {
      orderId: order.id,
      status: order.filled === order.quantity ? [span_20](start_span)'FILLED' : 'PARTIAL',[span_20](end_span)
      [span_21](start_span)filled: order.filled,[span_21](end_span)
      [span_22](start_span)remaining: order.quantity - order.filled[span_22](end_span)
    };
  }

  private matchOrders() {
    [span_23](start_span)[span_24](start_span)// Continue matching while the best buy price >= best sell price[span_23](end_span)[span_24](end_span)
    while (this.buyOrders.length > 0 && this.sellOrders.length > 0) {
      [span_25](start_span)const bestBuy = this.buyOrders[0];[span_25](end_span)
      [span_26](start_span)const bestSell = this.sellOrders[0];[span_26](end_span)

      [span_27](start_span)if (bestBuy.price >= bestSell.price) {[span_27](end_span)
        const executionPrice = bestSell.price; [span_28](start_span)// Sell limit is respected[span_28](end_span)
        [span_29](start_span)const executionQty = Math.min([span_29](end_span)
          [span_30](start_span)bestBuy.quantity - bestBuy.filled,[span_30](end_span)
          [span_31](start_span)bestSell.quantity - bestSell.filled[span_31](end_span)
        );

        [span_32](start_span)[span_33](start_span)this.recordTrade(bestBuy.id, bestSell.id, executionPrice, executionQty);[span_32](end_span)[span_33](end_span)

        [span_34](start_span)bestBuy.filled += executionQty;[span_34](end_span)
        [span_35](start_span)bestSell.filled += executionQty;[span_35](end_span)

        [span_36](start_span)// Remove fully filled orders from the book[span_36](end_span)
        [span_37](start_span)if (bestBuy.filled === bestBuy.quantity) this.buyOrders.shift();[span_37](end_span)
        [span_38](start_span)if (bestSell.filled === bestSell.quantity) this.sellOrders.shift();[span_38](end_span)
      } else {
        break; [span_39](start_span)// Spread is open, no more matches[span_39](end_span)
      }
    }
  }

  private executeMarketOrder(order: Order) {
    [span_40](start_span)// Select the opposite side of the book[span_40](end_span)
    [span_41](start_span)const counterOrders = order.side === 'BUY' ? this.sellOrders : this.buyOrders;[span_41](end_span)
    [span_42](start_span)let remaining = order.quantity;[span_42](end_span)

    [span_43](start_span)while (remaining > 0 && counterOrders.length > 0) {[span_43](end_span)
      [span_44](start_span)const counterOrder = counterOrders[0];[span_44](end_span)
      [span_45](start_span)const fillQty = Math.min(remaining, counterOrder.quantity - counterOrder.filled);[span_45](end_span)

      this.recordTrade(
        order.side === 'BUY' ? order.id : counterOrder.id,
        order.side === 'SELL' ? order.id : counterOrder.id,
        [span_46](start_span)[span_47](start_span)counterOrder.price, // Market orders take current best available price[span_46](end_span)[span_47](end_span)
        fillQty
      );

      [span_48](start_span)order.filled += fillQty;[span_48](end_span)
      [span_49](start_span)counterOrder.filled += fillQty;[span_49](end_span)
      [span_50](start_span)remaining -= fillQty;[span_50](end_span)

      [span_51](start_span)if (counterOrder.filled === counterOrder.quantity) {[span_51](end_span)
        [span_52](start_span)counterOrders.shift();[span_52](end_span)
      }
    }

    if (remaining > 0) {
      [span_53](start_span)throw new Error(`Insufficient liquidity. Remaining: ${remaining}`);[span_53](end_span)
    }

    [span_54](start_span)[span_55](start_span)return { orderId: order.id, status: 'FILLED', filled: order.filled };[span_54](end_span)[span_55](end_span)
  }

  private recordTrade(buyerId: number, sellerId: number, price: number, qty: number) {
    [span_56](start_span)this.executedTrades.push({[span_56](end_span)
      buyerId,
      sellerId,
      price,
      quantity: qty,
      [span_57](start_span)timestamp: Date.now()[span_57](end_span)
    });
  }
}

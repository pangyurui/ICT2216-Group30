import React, { useContext } from "react";
import { ShopContext } from "../../context/shop-context";
import { X } from "phosphor-react";


export const CartItem = (props) => {
  const { id, name, price, image } = props.data;
  const { cartItems, addToCart, removeFromCart, updateCartItemCount, removeAllCartItemsByName } =
    useContext(ShopContext);

  return (
    <div className="cartItem">
      
        <img src={image} alt={name} />
       
        
      <div className="description">
      
      <div className="descriptionHeader">
          <p>
            <b>{name}</b>
          </p>
          <X size={24} className="removeIcon" onClick={() => removeAllCartItemsByName(name)} />
        </div>
        <p> Price: ${price}</p>
        <div className="countHandler">
          <button onClick={() => removeFromCart(id)}> - </button>
          <input
            value={cartItems[id]}
            onChange={(e) => updateCartItemCount(Number(e.target.value), id)}
          />
          <button onClick={() => addToCart(id)}> + </button>
        </div>
      </div>
    </div>
  );
};

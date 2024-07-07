import React, { useContext } from "react";
import { ShopContext } from "../../context/shop-context";
import { X } from "phosphor-react";
import "./cart-item.css";

export const CartItem = (props) => {
  const { id, quantity, productDetails } = props.data;
  const { name, price, image } = productDetails;
  const { removeFromCart, removeAllCartItemsByName, addToCartQuantity } =
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
        <p>Quantity
        <button className="countButton" onClick={() => removeFromCart(id)}> - </button>
        <span className="quantityDisplay">{quantity}</span>
        <button className="countButton" onClick={() => addToCartQuantity(id)}> + </button></p>
        </div>
      </div>
    </div>
  );
};

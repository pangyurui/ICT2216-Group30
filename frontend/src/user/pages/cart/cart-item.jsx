import React, { useContext } from "react";
import { ShopContext } from "../../context/shop-context";
import { X } from "phosphor-react";

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
        <p> Quantity: {quantity}</p>
        <div className="countHandler">
          <button onClick={() => removeFromCart(id)}> - </button>
          <span>{quantity}</span>
          <button onClick={() => addToCartQuantity(id)}> + </button>
        </div>
      </div>
    </div>
  );
};

import SanityBlockContent from "@sanity/block-content-to-react";
import React from "react";

import "./BlockContent.scss";

const serializers = {
  types: {
    block: (props) => {
      const { style = "normal" } = props.node;

      switch (style) {
        case "h1":
          return <h1 className="heading-1">{props.children}</h1>;
        case "h2":
          return <h2 className="heading-2">{props.children}</h2>;
        case "h3":
          return <h3 className="heading-3">{props.children}</h3>;
        case "h4":
          return <h4 className="heading-4">{props.children}</h4>;
        case "blockquote":
          return (
            <blockquote className="blockquote">{props.children}</blockquote>
          );
        default:
          return <p className="paragraph">{props.children}</p>;
      }
    },
  },
  list: (props) => {
    const { type } = props;
    if (type === "bullet") {
      return <ul className="bullet-list">{props.children}</ul>;
    }
    return <ol className="bullet-list">{props.children}</ol>;
  },
  listItem: (props) => <li className="list-item">{props.children}</li>,
  marks: {
    strong: (props) => <strong className="bold">{props.children}</strong>,
    em: (props) => <em className="italic">{props.children}</em>,
    link: (props) => (
      <a
        href={props.mark.href}
        className="link"
        target={props.mark.blank ? "_blank" : "_self"}
        rel={props.mark.blank ? "noopener noreferrer" : undefined}
      >
        {props.children}
      </a>
    ),
  },
};

export default function BlockContent({ content, className }) {
  return (
    <SanityBlockContent
      dataset={process.env.NEXT_PUBLIC_SANITY_DATASET || "production"}
      projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
      blocks={content}
      serializers={serializers}
      className={"block-content" + (className ? ` ${className}` : "")}
    />
  );
}

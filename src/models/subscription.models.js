/*
    MONGOOSE SUBSCRIPTION SCHEMA

    UNOPTIMIZED APPROACH 
    A common thought of modelling the subscription schema could be:- 
    - In the user User model, create a subscription field (which would be an array of ObjectId). 
    - Whenever the user (un)subscribes a channel, make a simple database call to push the ObjectId into the `subscription` field of that user document in the database.

    SCALABILITY PROBLEM WITH THE ABOVE MODEL:
    Suppose user has subscribed to a million channels and now wants to unsubscribe the first channel he had subscribed in the very beginning. Now it would be a very expensive database operation to search for that one channel in the millions of other channels subscribed by the user.


    OPTIMIZED APPROACH
    Create a Subscription Model with two fields:-
        - "subscriber" [type: ObjectId of "User" document]
        - "channel" [type: ObjectId of "User" document]

    - Whenever needed to find that whether the current user has subscribed to a particular channel or not, simply find that one "Subscription" document with the current user & the channel as the query-fields. If we get a document as a result, that means current user has subscribed to that channel.

    - Whenever a user subscribes to a channel, create a new "Subscription" document in the database with the current user & channel as the datafields.

    - Whenever a user unsubscribes to a channel, find that "Subscription" document with the current user & the channel as the query-fields and delete that document.

    - Whenever needed to find the channels the current user has subscribed to, find all the "Subscription" documents which have current user as the `subscriber` field in them.

    - Whenever needed to find the subscribers of the current channel (which is by the way a user only), find all the "Subscription" documents which have current channel as the `channel` field in them.

    NOTE:
    Since we are not using arrays, the amount of "Subscription" documents in the database would grow too huge with time. 
    This approach compromises with storage but optimizes latency issues (One can always buy more storage but the end-user doesn't want to wait for the loading times).


    COMMON EXAMPLES
    This approach can also be extended to various other backend systems such as:-

    Product purchases: 
    Make separate Product documents & store `product`, `seller` & `buyer` as the datafields to keep track of:-
    - How many people bought a specific product
    - A particular seller has which products in their inventory
    - A particular buyer has bought which products till now
*/

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

-- 0024_request_items_delete.sql
-- Lets the parties of a request delete an inventory item, as long as it is
-- not locked yet.
--
-- THE BUG: `request_items` had no DELETE policy. The « supprimer » button in
-- RequestItemsUploader ran a DELETE that RLS silently turned into zero rows;
-- PostgREST answered 204, the item vanished from the screen and came back on
-- the next load.
--
-- THE RULE: the client or the assigned seller may delete an item while it is
-- still a draft. Once the client has validated its minimum price, or the
-- seller has marked it sold, the item is part of the record and stays.
--
-- The files are removed by /api/request-items/[id], which deletes the row
-- with the caller's session (this policy decides) and then the photo and the
-- sale proof with the service role: the storage DELETE policy only lets a
-- user remove the files she uploaded herself.
--
-- Safe to re-run.

DROP POLICY IF EXISTS request_items_delete_unlocked ON public.request_items;

CREATE POLICY request_items_delete_unlocked ON public.request_items
    FOR DELETE TO authenticated
    USING (
        request_id IN (
            SELECT requests.id FROM public.requests
             WHERE requests.client_id = auth.uid() OR requests.seller_id = auth.uid()
        )
        AND min_price_validated_at IS NULL
        AND sold_at IS NULL
    );

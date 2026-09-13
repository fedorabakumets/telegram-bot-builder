# Узел stop_processing

Устанавливает `user_data[user_id]['_stop_processing'] = True`, чтобы последующие middleware
(incoming_message_trigger с `imtStopOnFlag`) не вызывали следующий handler в цепочке.

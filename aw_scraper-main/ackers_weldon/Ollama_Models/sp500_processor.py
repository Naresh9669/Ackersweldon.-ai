import pymongo

class SP500Processor:
    def __init__(self, mongo_uri, db_name, coll_name):
        self.connection = pymongo.MongoClient(mongo_uri)
        self.collection = self.connection[db_name][coll_name]
        
    def dropCollection(self):
        self.collection.drop()

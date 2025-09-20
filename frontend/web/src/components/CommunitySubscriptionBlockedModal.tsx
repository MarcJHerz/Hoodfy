import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ArchiveBoxIcon,
  PauseCircleIcon
} from '@heroicons/react/24/outline';

interface CommunitySubscriptionBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  status: 'suspended' | 'archived';
}

export default function CommunitySubscriptionBlockedModal({
  isOpen,
  onClose,
  communityName,
  status
}: CommunitySubscriptionBlockedModalProps) {
  const isSuspended = status === 'suspended';
  const isArchived = status === 'archived';

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {isSuspended ? (
                      <PauseCircleIcon className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <ArchiveBoxIcon className="h-8 w-8 text-orange-500" />
                    )}
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {isSuspended ? 'Community Suspended' : 'Community Archived'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSuspended ? (
                          <>
                            The community <span className="font-semibold text-gray-900 dark:text-gray-100">"{communityName}"</span> is currently suspended and is not accepting new subscriptions.
                          </>
                        ) : (
                          <>
                            The community <span className="font-semibold text-gray-900 dark:text-gray-100">"{communityName}"</span> has been archived and is not accepting new subscriptions.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    What does this mean?
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {isSuspended ? (
                      <>
                        <li>• New subscriptions are temporarily paused</li>
                        <li>• Existing members can still access the community</li>
                        <li>• The community may be reactivated in the future</li>
                      </>
                    ) : (
                      <>
                        <li>• New subscriptions are no longer accepted</li>
                        <li>• Existing members can still access the community</li>
                        <li>• The community is in read-only mode</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Redirect to explore page
                      window.location.href = '/explore';
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Explore Other Communities
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
